# /conventions — Spring Boot 코드 컨벤션

구현 전 반드시 확인. 코드 리뷰·신규 기능·리팩토링 포함 모든 코드 작업에 적용.

---

## 커밋 컨벤션

### 형식
```
type(scope): 제목

- 본문 줄 1 (선택)
- 본문 줄 2
```

- **제목**: 명령형, 마침표 없음
- **본문**: 최대 5줄, 개괄식(`-` 불릿). 변경 이유나 주요 내용이 자명하면 생략

### type
| type | 사용 |
|------|------|
| `feat` | 새 기능 |
| `fix` | 버그 수정 |
| `refactor` | 기능 변화 없는 구조 개선 |
| `chore` | 빌드·설정·의존성 변경 |
| `docs` | 문서·주석 |
| `test` | 테스트 추가·수정 |

### 커밋 단위
- 하나의 커밋에 모든 변경을 뭉치지 않는다
- 도메인·레이어·의미 단위로 커밋을 나눈다
- 지나치게 잘게 쪼개지도 않는다 — 한 흐름에서 함께 변경되는 파일은 하나의 커밋으로 묶는다

```
# ✅ 좋은 예 — 의미 단위로 분리
feat(cs): Cs 엔티티에 orderClaim FK 추가 및 Flyway 마이그레이션
feat(order): OrderClaimCompletionManager 오케스트레이터 구현
feat(order): ClaimRefundStrategy + Registry 구현

# ❌ 나쁜 예 — 전체를 하나로
feat(order): OrderClaim 처리완료 기능 구현 (CS/환불/상태전이 전체)
```

---

## @Transactional 규칙

클래스 레벨에 `@Transactional(readOnly = true)` 선언, write 메서드에만 `@Transactional` 개별 추가.

```java
@Service
@Transactional(readOnly = true)   // 클래스 레벨 디폴트
@RequiredArgsConstructor
public class FooService {

    public Foo getOne(Long id) { ... }   // readOnly 상속 — 어노테이션 생략

    @Transactional                        // write → 명시
    public void update(Long id) { ... }
}
```

`@Service`, `@Component` 싱글톤 모두 동일하게 적용.

---

## 전략 패턴 — Registry로 감싸기

전략 구현체 목록(`List<Strategy>`)을 직접 주입하지 않는다.
반드시 `*Registry` 컴포넌트로 감싸고, 외부에는 도메인 행위 메서드만 노출한다.

```java
// ✅ Registry 패턴
@Component
@RequiredArgsConstructor
public class ClaimRefundStrategyRegistry {

    private final List<ClaimRefundStrategy> strategies;

    private ClaimRefundStrategy get(OrderClaimType type) {   // 내부 resolve — private
        return strategies.stream()
            .filter(s -> s.supports(type))
            .findFirst()
            .orElseThrow(() -> new IllegalStateException(
                type.name() + "을(를) 지원하는 전략이 없습니다."));
    }

    public void refund(OrderClaim orderClaim, RefundEstimate estimate) {  // 도메인 행위만 노출
        get(orderClaim.getOrderClaimType()).refund(orderClaim, estimate);
    }
}

// ✅ 호출부 — Registry만 주입
@Service
public class SomeManager {
    private final ClaimRefundStrategyRegistry claimRefundStrategyRegistry;
}

// ❌ List<Strategy> 직접 주입
@Service
public class SomeManager {
    private final List<ClaimRefundStrategy> strategies;  // 금지
}
```

**규칙 요약**:
- Registry는 `@Component`, 전략 목록은 `private final List<Strategy>`로 Spring이 자동 수집
- `get(discriminator)` 메서드는 `private` — resolve 로직 은닉
- 공개 메서드는 도메인 언어로 명명 (`refund`, `cancel`, `send` 등)

---

## Repository 접근 규칙

상위 Service / Component는 타 도메인 Repository에 **직접 접근하지 않는다**.
반드시 해당 Repository를 소유한 Service를 통해 접근한다.

```java
// ✅
@Service
public class OrderCompletionManager {
    private final CsService csService;       // CsRepository의 소유 서비스
}

// ❌
@Service
public class OrderCompletionManager {
    private final CsRepository csRepository; // 타 도메인 Repository 직접 주입 금지
}
```

---

## 생성자 주입

`@RequiredArgsConstructor` + `private final` 필드. `@Autowired` 필드 주입 금지.

```java
@Service
@RequiredArgsConstructor
public class OrderService {
    private final OrderRepository orderRepository;
    private final PaymentGateway paymentGateway;
}
```

---

## enum 포맷 규칙

enum 선언 직후 첫 줄을 비우지 않는다.

```java
// ✅
public enum FeeRuleType {
    AMOUNT_FREE,
    RATE,
}

// ❌
public enum FeeRuleType {

    AMOUNT_FREE,
    RATE,
}
```

---

## 외부 API 호출과 트랜잭션

`@Transactional` 블록 **안에서** 외부 HTTP 호출(PG, SMS, 이메일 등)을 하지 않는다.
커밋 이후 콜백(`@TransactionalEventListener`) 또는 트랜잭션 외부 메서드로 분리한다.

```java
// ✅
@Transactional
public void placeOrder(OrderCommand cmd) {
    Order order = orderRepository.save(Order.of(cmd));
    applicationEventPublisher.publishEvent(new OrderPlacedEvent(order.getId()));
}

@TransactionalEventListener(phase = AFTER_COMMIT)
public void sendConfirmationEmail(OrderPlacedEvent event) {
    emailClient.send(...); // 트랜잭션 커밋 후 실행
}

// ❌
@Transactional
public void placeOrder(OrderCommand cmd) {
    Order order = orderRepository.save(Order.of(cmd));
    emailClient.send(...); // 롤백 시 이메일은 이미 발송됨
}
```

---

## 프로젝트별 추가 컨벤션

bstack을 사용하는 각 프로젝트의 `CLAUDE.md` 또는 프로젝트 전용 `/conventions` 스킬에 추가 규칙을 정의한다.
(예: 멀티모듈 엔티티 동기화 정책, Flyway 버전 관리, 프로젝트 표준 예외 클래스 등)
