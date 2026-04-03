# RED FLAGS — 자주 발생하는 함정

코드 리뷰 또는 구현 중 발견 시 즉시 멈추고 확인해야 하는 패턴들.

---

## 🔴 즉시 수정 (CRITICAL)

### RF-001: 하드코딩된 민감 정보
```java
// 금지
private static final String JWT_SECRET = "mySecretKey123";
dataSource.setPassword("password");
```
**해결**: 환경변수 또는 Spring Cloud Config / Vault 사용.

### RF-002: SQL Injection 가능 코드
```java
// 금지
@Query(value = "SELECT * FROM users WHERE name = '" + name + "'", nativeQuery = true)
```
**해결**: 파라미터 바인딩 (`@Param`) 또는 QueryDSL 사용.

### RF-003: 접근 제어 없는 관리자 API
```java
// 금지: @PreAuthorize 없는 admin 엔드포인트
@DeleteMapping("/api/admin/users/{id}")
public void deleteUser(@PathVariable Long id) { ... }
```

---

## 🟠 PR 전 수정 (HIGH)

### RF-004: N+1 쿼리
```java
// 위험
orders.forEach(o -> log.info(o.getMember().getName())); // 각 order마다 쿼리
```
**해결**: Fetch Join 또는 `@BatchSize`. `/perf` 스킬 참조.

### RF-005: Entity 직접 반환
```java
// 금지
public ResponseEntity<Order> getOrder(...) { ... } // Order는 @Entity
```
**해결**: Response DTO 생성. `/api-review` 스킬 참조.

### RF-006: Controller에 @Transactional
```java
// 금지
@RestController
@Transactional
public class OrderController { ... }
```

### RF-007: 재고/잔액 동시성 미처리
```java
// 위험: Lost Update 가능
Product p = repo.findById(id).orElseThrow();
p.decreaseStock(qty); // 동시 요청 시 손실
```
**해결**: 비관적 잠금, 낙관적 잠금, 또는 원자적 UPDATE. `/audit` 스킬 참조.

### RF-008: IDOR (Insecure Direct Object Reference)
```java
// 위험: 소유자 확인 없음
@GetMapping("/orders/{id}")
public Order getOrder(@PathVariable Long id) {
    return service.findById(id); // 다른 사용자 주문 조회 가능!
}
```

---

## 🟡 다음 스프린트 개선 (MEDIUM)

### RF-009: @Transactional(readOnly=true) 미사용
```java
// 개선 필요
@Service
public class ProductService {
    // 읽기 전용 메서드인데 @Transactional(readOnly=true) 없음
    public Product getProduct(Long id) { ... }
}
```

### RF-010: LazyInitializationException 임시 방편
```java
// 잘못된 해결: EAGER로 변경
@OneToMany(fetch = FetchType.EAGER) // 금지!
```
**올바른 해결**: Fetch Join 또는 DTO Projection. `/persistence` 스킬 참조.

### RF-011: 테스트에서 DB Mock 사용
```java
// 위험: Mock DB는 실제 동작과 다를 수 있음
@MockBean
private JdbcTemplate jdbcTemplate;
```
**해결**: TestContainers로 실제 DB 사용. `/test` 스킬 참조.

### RF-012: 빈약한 도메인 모델
```java
// 안티패턴: 모든 로직이 Service에
@Service
public class OrderService {
    public void process(Order order) {
        if (order.getStatus() == PENDING) {  // 도메인 로직이 Service에
            order.setStatus(PROCESSING);
        }
    }
}
```
**해결**: 도메인 로직은 Entity 내부로 이동.

---

## 🔵 개선 권고 (LOW)

### RF-013: @Autowired 필드 주입
```java
@Autowired
private OrderService orderService; // 생성자 주입으로 변경 권장
```

### RF-014: 너무 넓은 @Transactional 범위
트랜잭션 내에서 외부 API 호출, 파일 I/O 등 오래 걸리는 작업 포함.

### RF-015: 테스트 성공 로그 과다 출력
`spring.jpa.show-sql=true`를 테스트 환경에서 끄지 않아 Context Rot 발생.

---

## 발견 시 처리

| 심각도 | 처리 |
|---|---|
| CRITICAL | 작업 즉시 중단, 수정 후 재개 |
| HIGH | 현재 PR에서 수정 |
| MEDIUM | 별도 이슈 생성, 다음 스프린트 처리 |
| LOW | 코드 리뷰 코멘트로 남기기 |
