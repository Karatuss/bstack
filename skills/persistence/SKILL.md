---
name: persistence
description: JPA/Hibernate 관용·트랜잭션 경계·N+1·쿼리 최적화. @Transactional 위치·LazyInitialization 이슈 시 사용.
---

# /persistence — JPA / 트랜잭션 / 쿼리 스킬

JPA/Hibernate 관용 패턴, N+1 탐지, 트랜잭션 경계 설계, 쿼리 최적화를 다룬다.

## When to use

- N+1 쿼리 문제 의심 또는 확인
- 트랜잭션 경계, `@Transactional` 위치 결정
- JPA 연관관계 매핑 설계
- 쿼리 성능 최적화 (JPQL, QueryDSL, Native Query)
- `LazyInitializationException` 발생
- 대량 데이터 처리 (Batch Insert/Update)

## N+1 탐지 체크리스트

```java
// 문제: Collection을 LAZY로 두고 반복 접근
List<Order> orders = orderRepository.findAll();
orders.forEach(o -> o.getItems().size()); // N+1 발생

// 해결 1: Fetch Join
@Query("SELECT o FROM Order o JOIN FETCH o.items WHERE o.status = :status")
List<Order> findByStatusWithItems(@Param("status") OrderStatus status);

// 해결 2: @EntityGraph
@EntityGraph(attributePaths = {"items", "items.product"})
List<Order> findAll();

// 해결 3: Batch Size (컬렉션 N+1을 IN 쿼리로)
@BatchSize(size = 100)
@OneToMany(mappedBy = "order")
private List<OrderItem> items;
```

**N+1 확인 도구**: `spring.jpa.show-sql=true` + `p6spy` or `datasource-proxy`

## 트랜잭션 경계 원칙

```java
// 올바른 위치: Service 레이어
@Service
@Transactional(readOnly = true)  // 클래스 기본: 읽기 전용
public class OrderService {

    @Transactional  // 쓰기 작업만 오버라이드
    public Order createOrder(CreateOrderCommand cmd) { ... }

    public OrderDto getOrder(Long id) { ... }  // readOnly 상속
}

// 금지
@RestController
@Transactional  // Controller에 @Transactional 금지
public class OrderController { ... }
```

**트랜잭션 전파 기본**: `REQUIRED` (기존 트랜잭션에 참여)
**이벤트 발행**: `@TransactionalEventListener(phase = AFTER_COMMIT)`

## 연관관계 매핑 가이드

| 관계 | 기본 FetchType | 권장 |
|---|---|---|
| `@ManyToOne` | EAGER | LAZY로 변경 |
| `@OneToOne` | EAGER | LAZY로 변경 (소유 측) |
| `@OneToMany` | LAZY | 유지, Fetch Join 활용 |
| `@ManyToMany` | LAZY | 중간 엔티티로 분해 권장 |

## 대량 처리

```java
// Batch Insert (JDBC batch 활성화 필요)
# application.yml
spring.jpa.properties.hibernate.jdbc.batch_size: 50
spring.jpa.properties.hibernate.order_inserts: true

// Slice 기반 페이징 (count 쿼리 생략)
Slice<Order> findByStatus(OrderStatus status, Pageable pageable);

// Bulk Update (영속성 컨텍스트 우회)
@Modifying(clearAutomatically = true)
@Query("UPDATE Order o SET o.status = :status WHERE o.createdAt < :date")
int bulkUpdateStatus(@Param("status") OrderStatus status, @Param("date") LocalDateTime date);
```

## 자주 발생하는 문제

| 증상 | 원인 | 해결 |
|---|---|---|
| `LazyInitializationException` | 세션 외부에서 Lazy 로딩 | Fetch Join 또는 DTO Projection |
| 영속성 컨텍스트 메모리 증가 | 대량 조회 후 미사용 엔티티 | `em.clear()` 또는 DTO Projection |
| Dirty Checking 미작동 | 트랜잭션 외부에서 수정 | 트랜잭션 범위 내에서 수정 |
| `MultipleBagFetchException` | 두 Collection Fetch Join 동시 | 하나만 Fetch Join + `@BatchSize` |


---

## References

- docs/STYLE_GUIDE.md — 원칙 (Karpathy 4 + 동료 협업 + 정량)
- docs/RED_FLAGS.md — 안티패턴
- docs/LAYER_RULES.md — 레이어 규칙
