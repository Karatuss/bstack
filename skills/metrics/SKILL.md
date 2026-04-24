---
name: metrics
description: 정량 예측/측정 체크리스트 — QPS, row 수, join fan-out, p99 목표. 설계·리뷰 pre-condition.
---

# /metrics — 정량 지표 스킬

"감이 아니라 숫자로." 설계·리뷰 전 이 체크리스트가 비면 진행 금지.

## When to use

- 새 엔드포인트/기능 설계 전
- `/architect` · `/persistence` · `/perf` 진입 시 pre-condition
- 부하 예측, 쿼리 튜닝 우선순위 결정
- SLO/SLA 수치 명시

## How

### 필수 예측 6항목

| 항목 | 질문 | 단위 |
|---|---|---|
| QPS | 현재 / 3개월 후 / 1년 후 | req/s |
| Row 수 | 엔드포인트·쿼리별 반환 row | rows |
| Join fan-out | N × M 예상 결과 크기 | rows |
| p99 latency | read / write 분리 목표 | ms |
| SLA | 가용성, 에러율 임계 | %, % |
| 캐시 적중률 | 목표치 + 측정 방법 | % |

### 측정 방법 (실측 필요 시)

```java
// Micrometer — 서비스 메서드 타이밍
@Timed("order.create")
public Order create(...) { ... }

// HikariCP wait + active
HikariDataSource ds = ...;
ds.getHikariPoolMXBean().getThreadsAwaitingConnection();
```

### 쿼리 row/fan-out

```sql
-- EXPLAIN ANALYZE 필수 (PostgreSQL)
EXPLAIN (ANALYZE, BUFFERS) SELECT ...;

-- MySQL
EXPLAIN FORMAT=JSON SELECT ...;
```

확인 포인트: `rows` 컬럼, nested loop 반복 횟수, index usage.

### "모르겠다"의 처리

- 모르면 결론이 "모름" 자체. 진행 전에 실측 또는 합리적 추정치 + 출처를 남긴다.
- 추정은 **근거**와 함께: "기존 유사 엔드포인트 X의 p99가 120ms 이므로 150ms 목표".

## Decision tree

```
설계 요청 수신
├── 6항목 전부 예측 있음 → /architect 로 진행
├── 일부 누락
│   ├── 실측 가능 → micrometer/EXPLAIN 으로 즉시 측정
│   └── 실측 불가 (신규 기능) → 근거 있는 추정치 기록
└── 전부 누락 → 설계 중단, 예측부터
```

## References

- `docs/STYLE_GUIDE.md#정량-지표-요구`
- `/perf` — 측정 후 최적화
- `/persistence` — 쿼리 row/fan-out 실측
- `/observability` — Micrometer 설정
