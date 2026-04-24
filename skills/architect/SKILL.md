---
name: architect
description: DDD·모듈 경계·레이어 설계 리뷰. 구조 개선·의존성 방향·Bounded Context 논의 시 사용.
---

# /architect — 설계 리뷰 스킬

DDD, 모듈 경계, 레이어 설계, Bounded Context 관련 설계 결정을 검토하고 제안한다.

## When to use

- 레이어 구조 또는 모듈 분리 방향 논의
- Bounded Context 또는 도메인 경계 설정
- 새 기능의 위치(어느 레이어/모듈에 둘지) 결정
- 의존성 방향이 올바른지 검토 요청

## 시작 전 필수

1. `docs/ARCHITECTURE.md` 읽기
2. `docs/LAYER_RULES.md` 읽기
3. 관련 `docs/specs/*.md` 읽기 (있는 경우)
4. 현재 패키지 구조 파악 (`src/main/java/**` glob)

## 설계 원칙

### 레이어 의존성 (단방향)
```
Controller → Service → Domain
Controller → Service → Repository(interface)
Domain (Entity, VO, DomainEvent) — 외부 의존 없음
Infrastructure (Repository 구현) → Domain
```

### 금지 패턴
- Controller가 Repository를 직접 호출
- 두 Service가 서로를 직접 의존 (순환)
- 공통 유틸리티에 비즈니스 로직 숨기기
- `@Component`를 도메인 클래스에 사용

### Bounded Context 가이드
- 각 Context는 자신의 도메인 객체를 소유
- Context 간 통신은 이벤트 또는 명시적 API
- 공유 커널은 최소화, 변경 시 양측 동의 필요
- Anti-Corruption Layer로 외부 모델 격리

### 패키지 구조 (Hexagonal — 권장)

상세 구조·역할 명명·레퍼런스 레포 → `docs/NAMING.md`.

```
com.example.myapp
├── domain/          # 의존성 0. 순수 Java. Spring 어노테이션 불가.
│   └── order/
│       ├── Order.java              # AggregateRoot
│       ├── OrderRepository.java    # OutputPort (interface, domain에 위치)
│       └── OrderCreatedEvent.java  # DomainEvent
├── application/     # domain 만 의존. UseCase 정의 + 구현.
│   └── order/
│       ├── port/in/CreateOrderUseCase.java   # InputPort interface
│       ├── port/out/LoadOrderPort.java        # OutputPort interface
│       ├── CreateOrderCommand.java            # record
│       └── service/CreateOrderService.java   # UseCase 구현 (package-private)
├── infrastructure/  # Spring + JPA. Adapter 구현.
│   └── order/
│       ├── OrderRepositoryAdapter.java        # domain port 구현
│       └── OrderEntity.java                   # JPA @Entity (domain Entity 아님)
└── interfaces/      # HTTP/gRPC 어댑터.
    └── api/order/
        ├── OrderController.java               # InputPort 주입
        └── CreateOrderRequest.java            # API DTO
```

레퍼런스: [thombergs/buckpal](https://github.com/thombergs/buckpal) · [ddd-by-examples/library](https://github.com/ddd-by-examples/library)

## 출력 형식

1. **현재 구조 분석**: 실제 코드 기반, 위반 사항 명시
2. **제안**: 구체적인 이동/분리 방향, 이유 포함
3. **마이그레이션 순서**: 점진적 변경 가능한 단계 제시
4. **ArchUnit 검증**: 변경 후 `/arch-guard`로 제약 코드화 권장

## 완료 후

설계 결정 사항은 `docs/ARCHITECTURE.md` 또는 `docs/specs/ADR-NNN.md`에 기록.
`/spec` 스킬로 연계.


---

## References

- docs/NAMING.md — DDD/Clean Architecture 역할 명명 + 패키지 구조 + 레퍼런스 레포
- docs/STYLE_GUIDE.md — 원칙 (Karpathy 4 + 동료 협업 + 정량)
- docs/RED_FLAGS.md — 안티패턴
- docs/LAYER_RULES.md — 레이어 규칙
