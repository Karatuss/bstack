# NAMING — DDD/Clean Architecture 역할 명명 가이드

Hexagonal Architecture + DDD 기준. "Service 1개에 다 때려넣기" 방식(돌쇠네 패턴) 금지.
레퍼런스: [buckpal](https://github.com/thombergs/buckpal) · [ddd-by-examples/library](https://github.com/ddd-by-examples/library)

---

## 패키지 구조 (Hexagonal + Multi-module)

```
com.example.myapp
├── domain/          ← 의존성 0. 순수 Java. Spring 어노테이션 불가.
├── application/     ← domain 만 의존. UseCase 정의 + 구현.
├── infrastructure/  ← application + Spring + JPA. Adapter 구현.
└── interfaces/      ← application 의 port/in/ 의존. HTTP·gRPC·CLI.
```

Maven 멀티모듈로 분리하면 `domain` 모듈에 Spring이 들어오는 순간 **컴파일 오류**로 감지.

### 상세 패키지 (feature 단위 내부)

```
com.example.myapp
├── domain/
│   └── order/
│       ├── Order.java                  # AggregateRoot
│       ├── OrderItem.java              # Entity (child)
│       ├── Money.java                  # ValueObject
│       ├── OrderStatus.java            # Enum (domain)
│       ├── OrderCreatedEvent.java      # DomainEvent
│       ├── OrderRepository.java        # OutputPort (interface, domain 패키지)
│       └── OrderPricingPolicy.java     # DomainService
│
├── application/
│   └── order/
│       ├── port/
│       │   ├── in/
│       │   │   ├── CreateOrderUseCase.java   # InputPort (interface)
│       │   │   └── CancelOrderUseCase.java
│       │   └── out/
│       │       └── LoadOrderPort.java        # OutputPort (interface, infra 구현)
│       ├── CreateOrderCommand.java     # Command (record)
│       ├── CancelOrderCommand.java
│       ├── GetOrderQuery.java          # Query (record)
│       ├── OrderResult.java            # Output DTO (record)
│       └── service/
│           ├── CreateOrderService.java # implements CreateOrderUseCase (package-private 권장)
│           └── GetOrderService.java
│
├── infrastructure/
│   └── order/
│       ├── OrderJpaRepository.java     # Spring Data interface
│       ├── OrderEntity.java            # JPA @Entity — domain Order 아님
│       ├── OrderRepositoryAdapter.java # implements domain.OrderRepository + LoadOrderPort
│       └── OrderEntityMapper.java
│
└── interfaces/
    └── api/
        └── order/
            ├── OrderController.java    # @RestController, InputPort 주입
            ├── CreateOrderRequest.java # record (HTTP API contract)
            ├── OrderResponse.java
            └── OrderRequestMapper.java # Request→Command, Result→Response
```

---

## 역할 명명 규칙

### Domain layer

| 역할 | 이름 패턴 | 책임 |
|---|---|---|
| `AggregateRoot` | `Order`, `Member` | 도메인 상태 + 불변식 보호. 외부 접근 단일 진입점. |
| `Entity` (child) | `OrderItem`, `Address` | Aggregate 내부, 독립 생존 불가. |
| `ValueObject` | `Money`, `Email`, `Period` | 불변, 동등성 by value. setter 없음. |
| `DomainEvent` | `OrderCreatedEvent` | Aggregate 가 발행하는 사실. 과거형. |
| `DomainService` | `OrderPricingPolicy` | 복수 Aggregate 걸친 순수 도메인 로직. |
| `Repository` (port) | `OrderRepository` | OutputPort interface. domain 패키지에 위치. |
| `Policy` | `HoldingPolicy`, `CheckingOutPolicy` | 도메인 규칙을 이름으로 명시 (ddd-by-examples 패턴). |
| `Specification` | `ExpiredHoldSpecification` | 도메인 조건을 캡슐화. |

### Application layer

| 역할 | 이름 패턴 | 책임 |
|---|---|---|
| `UseCase` (InputPort) | `CreateOrderUseCase` | 진입 계약 interface. **1 class = 1 operation.** |
| `Command` | `CreateOrderCommand` | write 연산 입력. record. |
| `Query` | `GetOrderQuery` | read 연산 입력. record. |
| `*Result` | `OrderResult` | Application 층 출력 DTO. record. |
| `*Service` (구현체) | `CreateOrderService` | UseCase 구현. package-private 권장. |
| `OutputPort` | `LoadOrderPort` | infra 호출 계약. Application 이 정의, infra 가 구현. |

### Infrastructure layer

| 역할 | 이름 패턴 | 책임 |
|---|---|---|
| `*RepositoryAdapter` | `OrderRepositoryAdapter` | domain Repository + LoadOrderPort 구현. |
| `*Entity` | `OrderEntity` | JPA 매핑 전용. domain Entity **아님**. |
| `*Mapper` | `OrderEntityMapper` | JPA Entity ↔ Domain 변환. |
| `*Adapter` (외부) | `PaymentGatewayAdapter` | 외부 API / MQ 연동. OutputPort 구현. |
| `*EventPublisherAdapter` | `SpringEventPublisherAdapter` | DomainEvent 발행 infra 구현. |

### Interface layer (API)

| 역할 | 이름 패턴 | 책임 |
|---|---|---|
| `*Controller` | `OrderController` | HTTP 어댑터. InputPort(UseCase) 호출만. |
| `*Request` | `CreateOrderRequest` | HTTP 입력 DTO. record. |
| `*Response` | `OrderResponse` | HTTP 출력 DTO. record. |
| `*RequestMapper` | `OrderRequestMapper` | Request→Command, Result→Response 변환. |

---

## 의존 방향 (단방향 강제)

```
interfaces → application(port/in) → domain
infrastructure → application(port/out) → domain

금지:
  domain → (누구도 안 됨)
  application → infrastructure
  domain → application
```

Controller 는 `CreateOrderUseCase`(interface)에 의존. 구현체 `CreateOrderService` 모른다.

---

## 핵심 코드 예시

```java
// domain — AggregateRoot
public class Order extends AggregateRoot<OrderId> {
    private OrderStatus status;
    private List<OrderItem> items;

    public static Order create(CustomerId buyer, List<OrderLine> lines, OrderPricingPolicy pricing) {
        Order o = new Order(OrderId.generate(), buyer, pricing.calculate(lines));
        o.registerEvent(new OrderCreatedEvent(o.getId(), buyer));
        return o;
    }

    public void cancel() {
        if (!status.isCancellable()) throw new OrderNotCancellableException(id);
        status = OrderStatus.CANCELLED;
        registerEvent(new OrderCancelledEvent(id));
    }
}
```

```java
// domain — Repository port (domain 패키지, Spring 어노테이션 없음)
public interface OrderRepository {
    Order findById(OrderId id);
    void save(Order order);
}
```

```java
// application — InputPort (UseCase interface)
public interface CreateOrderUseCase {
    OrderResult execute(CreateOrderCommand cmd);
}

// application — Command
public record CreateOrderCommand(CustomerId buyerId, List<OrderLineCommand> lines) {}
```

```java
// application — 구현체 (package-private, Spring만 알면 됨)
@Service
@RequiredArgsConstructor
@Transactional  // UseCase 경계 = 트랜잭션 경계
class CreateOrderService implements CreateOrderUseCase {
    private final OrderRepository orders;   // domain port
    private final LoadOrderPort loader;     // application output port

    @Override
    public OrderResult execute(CreateOrderCommand cmd) {
        Order order = Order.create(cmd.buyerId(), cmd.lines(), new OrderPricingPolicy());
        orders.save(order);
        return OrderResult.from(order);
    }
}
```

```java
// infrastructure — Adapter (domain port 구현)
@Repository
@RequiredArgsConstructor
public class OrderRepositoryAdapter implements OrderRepository {
    private final OrderJpaRepository jpa;
    private final OrderEntityMapper mapper;

    @Override public Order findById(OrderId id) {
        return jpa.findById(id.value()).map(mapper::toDomain)
            .orElseThrow(() -> new OrderNotFoundException(id));
    }
    @Override public void save(Order order) { jpa.save(mapper.toEntity(order)); }
}
```

```java
// interfaces — Controller (UseCase interface 주입, 구현체 모름)
@RestController
@RequestMapping("/api/v1/orders")
@RequiredArgsConstructor
public class OrderController {
    private final CreateOrderUseCase createOrder;  // 포트만 알면 됨
    private final OrderRequestMapper mapper;

    @PostMapping
    @ResponseStatus(CREATED)
    public OrderResponse create(@Valid @RequestBody CreateOrderRequest req) {
        return mapper.toResponse(createOrder.execute(mapper.toCommand(req)));
    }
}
```

---

## 기존 방식 vs DDD/Clean

| 기존 (돌쇠네) | DDD/Clean | 이유 |
|---|---|---|
| `OrderService` 1 God class | `CreateOrderUseCase` + `CancelOrderUseCase` … | SRP. 1 UseCase = 1 operation. |
| `@Service` 가 Repository 직접 구현 | domain `OrderRepository` port + `OrderRepositoryAdapter` 구현 | 의존성 역전 |
| `@Entity` = 도메인 Entity | `OrderEntity`(JPA) ≠ `Order`(domain) | JPA 매핑 관심사 분리 |
| DTO = Request = Service 입력 혼용 | Command / Query / Result / Request / Response 분리 | 계층별 계약 명확화 |
| `@Transactional` on Controller 또는 Repository | UseCase 구현체(`*Service`)에만 선언 | 트랜잭션 경계 = use case 경계 |
| Service 간 직접 호출 순환 | Bounded Context 간 DomainEvent 구독 | 결합도 제거 |

---

## 레퍼런스 레포지토리

### 1. [thombergs/buckpal](https://github.com/thombergs/buckpal)

> "Get Your Hands Dirty on Clean Architecture" (책) 예제.

- Hexagonal + UseCase 인터페이스 가장 교과서적.
- `port/in/` (InputPort) · `port/out/` (OutputPort) 명명 표준 출처.
- `adapter/in/web/` · `adapter/out/persistence/` 명명도 여기서.
- Spring Boot 3.x, 코드 짧고 명확. **구조 참조 1순위.**

### 2. [ddd-by-examples/library](https://github.com/ddd-by-examples/library)

> Jakub Pilimon (VMware/Broadcom). DDD 블루북 패턴 실전 적용.

- Event Sourcing 없이 순수 DDD — 진입 장벽 낮음.
- `Policy` 클래스로 도메인 규칙 명명 (코드가 유비쿼터스 언어를 그대로 표현).
- Bounded Context 간 Anti-Corruption Layer 실제 구현 포함.
- `Aggregate` → `DomainEvent` → `EventListener` 흐름 완전 구현.
- **도메인 모델 깊이 참조 1순위.**

### 3. [spring-projects/spring-petclinic](https://github.com/spring-projects/spring-petclinic) _(반면교사)_

- Spring 공식이지만 DDD 아님. "돌쇠네" 패턴 원형.
- "Spring 이 뭘 기본 제공하는가" 파악용. 구조 모방 금지.

### 4. [Sairyss/domain-driven-hexagon](https://github.com/Sairyss/domain-driven-hexagon) _(Node.js지만)_

- 언어는 TypeScript지만 역할 명명 체계가 가장 상세하게 문서화.
- Command / Query / UseCase / Port / Adapter / Mapper 각각의 책임 설명 탁월.
- Java 팀이 개념 참조용으로 읽기 좋음.

### 5. [mspnp/java-design-patterns-for-azure](https://github.com/microsoft/java-design-patterns) _(참고)_

- 패턴 카탈로그 중 Saga, CQRS, Event Sourcing 구현 참고.

---

## ArchUnit 규칙 연동

`/arch-guard` 에서 이 문서 기준 의존 방향을 테스트로 강제:

```java
@ArchTest
ArchRule domainHasNoDependencies =
    noClasses().that().resideInAPackage("..domain..")
        .should().dependOnClassesThat()
        .resideInAnyPackage("..application..", "..infrastructure..", "..interfaces..");

@ArchTest
ArchRule applicationDoesNotDependOnInfra =
    noClasses().that().resideInAPackage("..application..")
        .should().dependOnClassesThat()
        .resideInAPackage("..infrastructure..");

@ArchTest
ArchRule onlyAdaptersImplementPorts =
    classes().that().implement(OrderRepository.class)
        .should().resideInAPackage("..infrastructure..");
```
