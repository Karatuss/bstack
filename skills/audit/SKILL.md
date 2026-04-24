---
name: audit
description: Spring Security 취약점·동시성 이슈·데이터 무결성 통합 감사. 배포 전·금융 결제 코드 검토·전수 점검 시 사용.
---

# /audit — 보안 + 동시성 통합 감사 스킬

Spring Security 취약점, 동시성 이슈, 데이터 무결성 문제를 종합적으로 감사한다.

## When to use

- 보안 감사 또는 코드 리뷰 전
- 동시성 버그 의심 (Race condition, Deadlock)
- 금융/결제 관련 코드 검토
- 인증/인가 로직 전수 점검
- 운영 환경 배포 전 최종 보안 점검

## 보안 감사

### 인증/인가 취약점
```java
// 위험: 접근 제어 없는 엔드포인트
@GetMapping("/api/admin/users")  // @PreAuthorize 없음!
public List<User> getAllUsers() { ... }

// 위험: ID 추측 가능한 직접 객체 참조
@GetMapping("/api/orders/{id}")
public Order getOrder(@PathVariable Long id) {
    return orderRepository.findById(id).orElseThrow();  // 소유자 확인 없음!
}

// 안전: 소유자 확인
@GetMapping("/api/orders/{id}")
@PreAuthorize("@orderSecurity.isOwner(#id, authentication)")
public Order getOrder(@PathVariable Long id) { ... }
```

### SQL Injection
```java
// 위험
@Query(value = "SELECT * FROM orders WHERE status = '" + status + "'", nativeQuery = true)

// 안전
@Query(value = "SELECT * FROM orders WHERE status = :status", nativeQuery = true)
List<Order> findByStatus(@Param("status") String status);
```

### 민감 정보 노출
- 응답에 비밀번호 해시 포함 여부
- 로그에 PII(개인정보) 출력 여부
- 에러 응답에 스택트레이스 포함 여부
- JWT 페이로드에 민감 정보 포함 여부

## 동시성 감사

### Race Condition
```java
// 위험: 재고 감소 시 Lost Update
@Transactional
public void decreaseStock(Long productId, int quantity) {
    Product p = productRepository.findById(productId).orElseThrow();
    p.decreaseStock(quantity);  // 두 트랜잭션이 동시에 읽으면 손실
}

// 안전 1: 비관적 잠금
@Lock(LockModeType.PESSIMISTIC_WRITE)
Optional<Product> findByIdForUpdate(Long id);

// 안전 2: 낙관적 잠금
@Entity
public class Product {
    @Version
    private Long version;
}

// 안전 3: 원자적 업데이트
@Modifying
@Query("UPDATE Product p SET p.stock = p.stock - :qty WHERE p.id = :id AND p.stock >= :qty")
int decreaseStock(@Param("id") Long id, @Param("qty") int qty);
```

### Deadlock 패턴
- 여러 테이블을 항상 같은 순서로 잠금
- 트랜잭션 범위 최소화
- 인덱스 없는 WHERE 조건으로 인한 테이블 잠금 방지

### 원자성 위반
```java
// 위험: 두 작업이 원자적이지 않음
if (account.getBalance() >= amount) {     // 읽기
    account.withdraw(amount);             // 쓰기 (중간에 다른 트랜잭션 가능)
}

// 안전: DB 레벨에서 원자적 처리
@Modifying
@Query("UPDATE Account a SET a.balance = a.balance - :amount " +
       "WHERE a.id = :id AND a.balance >= :amount")
int withdraw(@Param("id") Long id, @Param("amount") BigDecimal amount);
// 반환값이 0이면 잔액 부족
```

## 감사 체크리스트

### 보안
- [ ] 모든 엔드포인트에 인증/인가 설정
- [ ] IDOR(Insecure Direct Object Reference) 없음
- [ ] SQL Injection 가능성 없음
- [ ] 민감 정보 로그 출력 없음
- [ ] 에러 응답에 내부 정보 노출 없음
- [ ] HTTPS 강제 설정
- [ ] 의존성 취약점 없음 (`./mvnw dependency-check:check`)

### 동시성
- [ ] 재고/잔액 등 임계 자원에 잠금 전략 있음
- [ ] `@Transactional` 범위가 적절히 좁음
- [ ] 멀티스레드 환경에서 공유 상태 없음 (또는 적절히 보호)
- [ ] Deadlock 가능 경로 없음

## 출력 형식

발견된 이슈를 심각도별로 분류:
- **CRITICAL**: 즉시 수정 (인증 우회, SQL Injection 등)
- **HIGH**: PR 전 수정 (IDOR, Race Condition 등)
- **MEDIUM**: 다음 스프린트 (민감 정보 노출, 잠금 전략 미흡)
- **LOW**: 개선 권고 (코드 스타일, 로깅 개선)


---

## References

- docs/STYLE_GUIDE.md — 원칙 (Karpathy 4 + 동료 협업 + 정량)
- docs/RED_FLAGS.md — 안티패턴
- docs/LAYER_RULES.md — 레이어 규칙
