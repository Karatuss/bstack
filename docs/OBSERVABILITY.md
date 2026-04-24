# OBSERVABILITY — 대상 프로젝트 런타임 가이드

Spring Boot 3.x / Java 21 프로젝트에 적용하는 로깅·모니터링·Slack 알림 레시피.
bstack 자체는 적용 대상 아님 — **사용자 프로젝트** 에 설치.

`/observability` skill 의 상세 참조 문서.

---

## 1. Logging — Logback JSON

### 의존성 (Maven)

```xml
<dependency>
  <groupId>net.logstash.logback</groupId>
  <artifactId>logstash-logback-encoder</artifactId>
  <version>7.4</version>
</dependency>
```

### `src/main/resources/logback-spring.xml`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
  <springProperty name="APP_NAME" source="spring.application.name"/>

  <appender name="JSON" class="ch.qos.logback.core.ConsoleAppender">
    <encoder class="net.logstash.logback.encoder.LogstashEncoder">
      <includeMdcKeyName>traceId</includeMdcKeyName>
      <includeMdcKeyName>userId</includeMdcKeyName>
      <includeMdcKeyName>requestUri</includeMdcKeyName>
      <customFields>{"app":"${APP_NAME}"}</customFields>
    </encoder>
  </appender>

  <springProfile name="local,test">
    <root level="INFO">
      <appender-ref ref="CONSOLE"/>
    </root>
  </springProfile>

  <springProfile name="!local &amp; !test">
    <root level="INFO">
      <appender-ref ref="JSON"/>
    </root>
  </springProfile>
</configuration>
```

### MDC 주입 — `OncePerRequestFilter`

```java
@Component
public class MdcFilter extends OncePerRequestFilter {
  @Override
  protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
      throws ServletException, IOException {
    try {
      MDC.put("traceId", Optional.ofNullable(req.getHeader("X-Trace-Id"))
          .orElseGet(() -> UUID.randomUUID().toString()));
      MDC.put("requestUri", req.getRequestURI());
      String userId = SecurityContextHolder.getContext().getAuthentication() != null
          ? SecurityContextHolder.getContext().getAuthentication().getName()
          : "anonymous";
      MDC.put("userId", userId);
      chain.doFilter(req, res);
    } finally {
      MDC.clear();
    }
  }
}
```

---

## 2. Monitoring — Actuator + Prometheus

### 의존성

```xml
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-actuator</artifactId>
</dependency>
<dependency>
  <groupId>io.micrometer</groupId>
  <artifactId>micrometer-registry-prometheus</artifactId>
</dependency>
```

### `application.yml`

```yaml
management:
  endpoints:
    web:
      exposure:
        include: health,info,prometheus,metrics
  endpoint:
    health:
      probes:
        enabled: true
      show-details: when-authorized
  metrics:
    distribution:
      percentiles-histogram:
        http.server.requests: true
      slo:
        http.server.requests: 100ms, 300ms, 500ms
```

### 서비스 메서드 타이밍

```java
@Service
@RequiredArgsConstructor
public class OrderService {

  @Timed(value = "order.create", histogram = true)
  @Transactional
  public Order create(OrderCommand cmd) { ... }
}
```

### 대시보드 3종 (Grafana)
- **JVM**: `jvm_memory_used_bytes`, `jvm_gc_pause_seconds`, `jvm_threads_live_threads`
- **HikariCP**: `hikaricp_connections_active`, `hikaricp_connections_pending`, `hikaricp_connections_acquire_seconds`
- **HTTP (RED)**: `http_server_requests_seconds_count`, `_bucket`, 에러율은 `status=~"5.."` 비율

Grafana 대시보드 JSON 템플릿은 운영 레포의 `infra/grafana/` 하위에 커밋.

---

## 3. Slack alerting

### 옵션 A — Alertmanager → Webhook (추천)

`alertmanager.yml`:
```yaml
route:
  receiver: slack-default
  group_by: [alertname]
  group_wait: 30s
  group_interval: 5m
  repeat_interval: 1h

receivers:
  - name: slack-default
    slack_configs:
      - api_url: ${SLACK_WEBHOOK_URL}
        channel: '#alerts'
        title: '{{ .CommonAnnotations.summary }}'
        text: '{{ range .Alerts }}{{ .Annotations.description }}\n{{ end }}'
```

Prometheus rule 예시:
```yaml
groups:
  - name: slo
    rules:
      - alert: HighErrorRate
        expr: sum(rate(http_server_requests_seconds_count{status=~"5.."}[5m]))
          / sum(rate(http_server_requests_seconds_count[5m])) > 0.01
        for: 5m
        annotations:
          summary: "Error rate > 1%"
          description: "Service {{ $labels.app }} error rate {{ $value | humanizePercentage }}"
```

### 옵션 B — 앱 내부 `SlackNotifier`

```java
@Component
@RequiredArgsConstructor
public class SlackNotifier {

  private final WebClient webClient;
  @Value("${notify.slack.webhook}")
  private String webhookUrl;

  private final Map<String, Long> fingerprintTimestamps = new ConcurrentHashMap<>();
  private static final long DEDUP_WINDOW_MS = 5 * 60 * 1000;

  @Async
  public void notifyError(String fingerprint, String title, String detail) {
    long now = System.currentTimeMillis();
    Long last = fingerprintTimestamps.get(fingerprint);
    if (last != null && now - last < DEDUP_WINDOW_MS) {
      return;
    }
    fingerprintTimestamps.put(fingerprint, now);

    Map<String, Object> body = Map.of(
        "text", title,
        "attachments", List.of(Map.of(
            "color", "danger",
            "text", detail
        ))
    );

    webClient.post()
        .uri(webhookUrl)
        .bodyValue(body)
        .retrieve()
        .toBodilessEntity()
        .doOnError(e -> log.warn("Slack notify failed: {}", e.getMessage()))
        .subscribe();
  }
}
```

### 이벤트 기반 통합

```java
public record ErrorEvent(String fingerprint, String title, String detail) { }

@Service
@RequiredArgsConstructor
public class ErrorNotificationListener {
  private final SlackNotifier notifier;

  @EventListener
  public void handle(ErrorEvent e) {
    notifier.notifyError(e.fingerprint(), e.title(), e.detail());
  }
}

// 발행 측
publisher.publishEvent(new ErrorEvent(
    DigestUtils.md5Hex(exceptionStackTop),
    "[PAYMENT] 결제 게이트웨이 오류",
    ex.getMessage()
));
```

### `@Async` 설정

```java
@EnableAsync
@Configuration
public class AsyncConfig implements AsyncConfigurer {
  @Override
  public Executor getAsyncExecutor() {
    ThreadPoolTaskExecutor e = new ThreadPoolTaskExecutor();
    e.setCorePoolSize(2);
    e.setMaxPoolSize(8);
    e.setQueueCapacity(200);
    e.setThreadNamePrefix("notify-");
    e.initialize();
    return e;
  }
}
```

---

## 4. 임계치 레퍼런스

| 지표 | 기본 임계 | 비고 |
|---|---|---|
| 에러율 | > 1% / 5m | `status=~"5.."` |
| HTTP p99 | > 500ms / 5m | 엔드포인트별 세분화 권장 |
| HikariCP 대기 | > 100ms / 5m | pending connection > 0 경보 |
| JVM heap | > 85% / 10m | GC 튜닝 전 확장 우선 |
| Full GC | > 1회/min / 5m | 메모리 누수 의심 |
| Kafka lag (있으면) | > 1000 / 5m | consumer group 별 |

---

## 5. 로깅 보내는 곳 (선택)

- Loki — Promtail + Grafana 통합 쉬움, 자체 호스팅
- Elasticsearch — Kibana, 필드 검색 강력, 운영 비용 큼
- CloudWatch — AWS 네이티브, 비용/쿼리 느림 주의
- Datadog — 관측 SaaS, 비용 크고 표준 필드 자동 파싱

선정 기준: **팀 운영 가능 여부** > 기능. 로그량 추정 후 결정.

---

## 6. 운영 체크리스트

- [ ] JSON 로그 활성 (`!local & !test` 프로파일)
- [ ] MDC traceId 모든 HTTP 요청에 주입
- [ ] `/actuator/prometheus` 스크레이프 설정
- [ ] Grafana 대시보드 3종 (JVM/HikariCP/HTTP) import
- [ ] Alertmanager 규칙 최소 5종 (에러율/p99/heap/HikariCP/Full GC)
- [ ] Slack 채널 생성 + webhook URL 시크릿 저장
- [ ] 중복 알림 억제 (옵션 B 사용 시 fingerprint dedup 활성)
- [ ] 런북: 각 alert 에 대응 문서 링크
