---
name: perf
description: N+1·HikariCP·비동기 smell·캐싱 성능 최적화. API 응답 지연·쿼리 폭주·Thread pool 고갈 시 사용.
---

# /perf — 성능 최적화 스킬

N+1 쿼리 탐지, HikariCP 튜닝, 비동기 처리 smell, 캐싱 전략을 다룬다.

## When to use

- API 응답 속도 저하
- 데이터베이스 쿼리 수가 비정상적으로 많음
- 부하 테스트 시 병목 발생
- N+1 쿼리 의심
- Thread pool 고갈 또는 커넥션 타임아웃

## N+1 탐지 및 해결

### 탐지 방법
```yaml
# application-local.yml — 개발 시 쿼리 카운트 확인
logging:
  level:
    org.hibernate.SQL: DEBUG
    org.hibernate.orm.jdbc.bind: TRACE

# datasource-proxy 또는 p6spy로 쿼리 수 측정
```

### 해결 패턴
```java
// 문제 감지: 반복문 내 연관 접근
orders.stream().map(o -> o.getMember().getName())  // N+1

// 해결 1: Fetch Join
@Query("SELECT o FROM Order o JOIN FETCH o.member WHERE o.status = :s")
List<Order> findByStatusWithMember(@Param("s") OrderStatus s);

// 해결 2: DTO Projection (필요한 필드만)
@Query("SELECT new com.example.OrderSummary(o.id, m.name) FROM Order o JOIN o.member m")
List<OrderSummary> findAllSummaries();

// 해결 3: @BatchSize (컬렉션)
@BatchSize(size = 100)
@OneToMany(mappedBy = "order")
private List<OrderItem> items;
```

## HikariCP 튜닝

```yaml
spring:
  datasource:
    hikari:
      # 공식 공식: pool size = (core_count * 2) + effective_spindle_count
      maximum-pool-size: 10        # CPU 4코어 기준
      minimum-idle: 5
      connection-timeout: 30000    # 30초 (커넥션 못 얻으면 예외)
      idle-timeout: 600000         # 10분
      max-lifetime: 1800000        # 30분 (DB 서버 timeout보다 짧게)
      keepalive-time: 60000        # 1분 (idle 커넥션 유지)
```

**커넥션 풀 고갈 시 확인**:
1. `SELECT * FROM information_schema.processlist` (MySQL)
2. 트랜잭션이 너무 오래 열려있지 않은지
3. `@Transactional` 범위가 필요 이상으로 넓지 않은지

## 비동기 처리

```java
@Configuration
@EnableAsync
public class AsyncConfig {
    @Bean("taskExecutor")
    public Executor taskExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(5);
        executor.setMaxPoolSize(20);
        executor.setQueueCapacity(100);
        executor.setThreadNamePrefix("async-");
        executor.setRejectedExecutionHandler(new CallerRunsPolicy());
        executor.initialize();
        return executor;
    }
}

@Service
public class NotificationService {
    @Async("taskExecutor")
    public CompletableFuture<Void> sendEmail(String to, String body) {
        // 비동기 실행
        return CompletableFuture.completedFuture(null);
    }
}
```

**비동기 smell**:
- `@Async` 메서드에서 `@Transactional` 사용 시 새 트랜잭션으로 시작
- self-invocation으로 `@Async` 미적용
- 예외가 묻히는 경우 `AsyncUncaughtExceptionHandler` 등록

## 캐싱 전략

```java
@EnableCaching
@Configuration
public class CacheConfig {
    // Spring Cache + Redis
    @Bean
    public CacheManager cacheManager(RedisConnectionFactory factory) {
        RedisCacheConfiguration config = RedisCacheConfiguration.defaultCacheConfig()
            .entryTtl(Duration.ofMinutes(10))
            .serializeValuesWith(RedisSerializationContext.SerializationPair
                .fromSerializer(new GenericJackson2JsonRedisSerializer()));
        return RedisCacheManager.builder(factory)
            .cacheDefaults(config)
            .build();
    }
}

@Service
public class ProductService {
    @Cacheable(value = "products", key = "#id", unless = "#result == null")
    public ProductDto getProduct(Long id) { ... }

    @CacheEvict(value = "products", key = "#id")
    @Transactional
    public void updateProduct(Long id, UpdateProductCommand cmd) { ... }
}
```

## 성능 측정 도구

```bash
# JVM 힙 분석
jmap -histo <pid>

# 쿼리 실행 계획 (MySQL)
EXPLAIN ANALYZE SELECT ...

# Spring Actuator metrics
GET /actuator/metrics/hikaricp.connections.active
GET /actuator/metrics/http.server.requests
```


---

## References

- docs/STYLE_GUIDE.md — 원칙 (Karpathy 4 + 동료 협업 + 정량)
- docs/RED_FLAGS.md — 안티패턴
- docs/LAYER_RULES.md — 레이어 규칙
