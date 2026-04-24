---
name: observability
description: 대상 프로젝트 런타임 관측 — Spring Actuator, Micrometer, logback JSON, Slack webhook. 로깅/모니터링/알림 설계 시 사용.
---

# /observability — 런타임 관측 스킬

**대상**: bstack 을 사용하는 프로젝트의 런타임 (bstack 자체 아님).
**범위**: Logging · Monitoring · Slack alerting 설계와 설정.

> 상세 의존성·코드 샘플·logback XML 전체는 `docs/OBSERVABILITY.md` 참조.
> 이 SKILL.md는 언제/어떻게/decision tree 만.

## When to use

- 새 프로젝트 로깅·모니터링 초기 설정
- 장애 후 알림 누락 원인 추적 및 보강
- Slack 알림 채널 추가/중복 알림 억제
- 대시보드(Grafana) 기본 세트 구성
- SLO 위반 감지 임계치 설정

## How

### 1. Logging — Logback JSON + MDC
- 의존성: `logstash-logback-encoder`
- MDC 키: `traceId`, `userId`, `requestUri`, `method`
- 레벨 정책:
  - `INFO`: 비즈니스 경계 (주문 생성, 결제 완료)
  - `WARN`: 회복 가능 비정상 (retry 성공, fallback 동작)
  - `ERROR`: 알림 대상 (retry 실패, 예상 외 예외)

### 2. Monitoring — Actuator + Micrometer Prometheus
- 의존성: `spring-boot-starter-actuator`, `micrometer-registry-prometheus`
- 노출: `/actuator/prometheus`
- 커스텀 타이머: 주요 서비스 메서드에 `@Timed`
- 필수 대시보드 3종: **JVM** (heap/gc/thread) · **HikariCP** (active/wait) · **HTTP** (RED — rate/error/duration)

### 3. Slack alerting — 2가지 옵션

**옵션 A (추천, bstack 외부)**: Grafana/Prometheus Alertmanager → Slack webhook
- 장점: 앱 재시작 없이 규칙 변경, 표준 alerting
- 적합: 인프라 제어 가능한 팀

**옵션 B (앱 내부)**: Spring `WebClient` 기반 `SlackNotifier` + `@Async` + `ApplicationEventPublisher`/`@EventListener`
- 장점: 도메인 이벤트와 직접 연결, 인프라 의존 없음
- 중복 억제: `ConcurrentHashMap<fingerprint, ts>` — 동일 error fingerprint 5분 1회
- 적합: 인프라 제어 불가, ERROR 수준 즉시 알림만 필요

### 4. 임계치 예시 (Alertmanager 규칙)

| 지표 | 임계 | window |
|---|---|---|
| 에러율 | > 1% | 5분 |
| HTTP p99 | > 500ms | 5분 |
| HikariCP 대기 | > 100ms | 5분 |
| JVM heap | > 85% | 10분 |
| Full GC 빈도 | > 1/min | 5분 |

## Decision tree

```
알림 요구 수신
├── 인프라 제어 가능? (Prometheus/Alertmanager 운용 중)
│   └── 예 → 옵션 A (Alertmanager → webhook)
├── 아니오
│   ├── ERROR 레벨만 알림 → 옵션 B (SlackNotifier)
│   └── 비즈니스 이벤트 알림 (주문 N건, 결제 실패 등)
│       → 옵션 B + ApplicationEventPublisher
└── 둘 다 → A 우선, 앱 내 이벤트는 B 로 보강

로그 설계
├── 신규 프로젝트 → logback-spring.xml JSON + MDC 필수
├── 기존 plaintext → 점진 교체 (환경변수로 encoder 전환)
└── 멀티모듈 → 공통 모듈에 logback-spring.xml 제공
```

## References

- `docs/OBSERVABILITY.md` — 전체 설정·코드·의존성 샘플
- `docs/STYLE_GUIDE.md#정량-지표-요구`
- `/metrics` — SLO 수치 정하기
- `/perf` — 병목 탐지 후 관측 지표 보강
