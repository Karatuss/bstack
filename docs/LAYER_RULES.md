# 레이어 의존성 규칙

ArchUnit으로 CI에서 강제되는 규칙들의 상세 설명.

---

## 규칙 1: Controller는 Service만 호출

**규칙**: Presentation 레이어는 Application 레이어(Service)를 통해서만 데이터에 접근한다.

**금지**:
```java
// Controller에서 Repository 직접 주입 금지
@RestController
@RequiredArgsConstructor
public class OrderController {
    private final OrderRepository orderRepository; // 금지!
}
```

**허용**:
```java
@RestController
@RequiredArgsConstructor
public class OrderController {
    private final OrderService orderService; // OK
}
```

**이유**: Repository 직접 접근 시 비즈니스 로직이 Controller에 분산되고, 트랜잭션 경계 관리가 어려워진다.

---

## 규칙 2: Entity API 직접 노출 금지

**규칙**: Controller의 반환 타입에 `@Entity` 클래스 직접 사용 금지.

**금지**:
```java
@GetMapping("/orders/{id}")
public Order getOrder(@PathVariable Long id) { // Order가 @Entity면 금지
    return orderService.findById(id);
}
```

**허용**:
```java
@GetMapping("/orders/{id}")
public OrderResponse getOrder(@PathVariable Long id) { // DTO OK
    return OrderResponse.from(orderService.findById(id));
}
```

**이유**: Entity 직접 노출 시 내부 구조 변경이 API breaking change가 되고, 무한 재귀 직렬화 위험이 있다.

---

## 규칙 3: @Transactional 위치

**규칙**: `@Transactional`은 Application Service 레이어에만 허용.

**금지**:
```java
@RestController
@Transactional // Controller 금지
public class OrderController { ... }

@Entity
@Transactional // Domain 금지
public class Order { ... }
```

**허용**:
```java
@Service
@Transactional(readOnly = true)
public class OrderService {
    @Transactional
    public Order createOrder(CreateOrderCommand cmd) { ... }
}
```

**이유**: Controller에 `@Transactional`이 있으면 View 렌더링까지 트랜잭션이 열려있어 커넥션 고갈 위험이 있다.

---

## 규칙 4: Domain의 프레임워크 독립성

**규칙**: `domain` 패키지는 `org.springframework.*`에 의존하지 않는다.
단, JPA 어노테이션(`jakarta.persistence.*`)은 허용.

**금지**:
```java
package com.example.domain.model;

import org.springframework.stereotype.Component; // 금지

@Component // Domain에 Spring 어노테이션 금지
public class OrderValidator { ... }
```

**허용**:
```java
package com.example.domain.model;

import jakarta.persistence.Entity; // JPA 어노테이션 허용

@Entity
public class Order { ... }
```

**이유**: Domain이 프레임워크에 독립적이어야 테스트가 쉽고, 프레임워크 교체 시 도메인 로직을 재사용할 수 있다.

---

## 규칙 5: 순환 의존 금지

**규칙**: 패키지 또는 모듈 간 순환 의존 금지.

**금지**:
```
OrderService → PaymentService → OrderService (순환!)
```

**해결 방법**:
1. 공통 인터페이스로 추상화
2. 이벤트 기반 통신으로 전환 (`ApplicationEventPublisher`)
3. 공통 서비스를 별도 모듈로 분리

---

## ArchUnit 위반 시

```bash
# 위반 확인
./mvnw test -Dtest=ArchitectureTest

# 위반 목록 확인 후 /arch-guard 스킬로 세부 수정
```

위반 에러 메시지에는 수정 방법이 `because()` 절에 명시되어 있다.
