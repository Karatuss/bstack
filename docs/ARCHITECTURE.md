# 아키텍처 개요

> 이 파일은 bstack 하네스 기본 템플릿입니다.
> 각 프로젝트에 vendor/적용 시 프로젝트 실제 구조로 업데이트하세요.

---

## 레이어 구조

```
┌─────────────────────────────────────────┐
│            Presentation Layer            │
│   Controller, Request/Response DTO       │
├─────────────────────────────────────────┤
│            Application Layer             │
│   Service, UseCase, Command/Query        │
├─────────────────────────────────────────┤
│              Domain Layer                │
│   Entity, Value Object, DomainService   │
│   Repository Interface, Domain Event    │
├─────────────────────────────────────────┤
│          Infrastructure Layer            │
│   Repository Impl, External Adapters    │
│   DB Configuration, External API Client │
└─────────────────────────────────────────┘
```

## 의존성 방향 (단방향)

```
Presentation → Application → Domain
Infrastructure → Domain (Repository 인터페이스 구현)
```

Presentation과 Infrastructure는 서로 직접 의존하지 않는다.

## 패키지 구조 (권장)

```
com.example.{context}/
├── domain/
│   ├── model/          # Entity, Value Object
│   ├── repository/     # Repository 인터페이스
│   ├── service/        # Domain Service
│   └── event/          # Domain Event
├── application/
│   ├── service/        # Application Service
│   ├── command/        # Command 객체
│   └── query/          # Query 객체
├── infrastructure/
│   ├── persistence/    # Repository 구현체
│   └── external/       # 외부 API 클라이언트
└── presentation/
    ├── controller/     # REST Controller
    └── dto/            # Request/Response DTO
```

## 핵심 제약

1. **Controller → Repository 직접 접근 금지**
2. **Entity API 직접 노출 금지** (Response DTO 필수)
3. **@Transactional은 Service 레이어에만**
4. **Domain은 Spring 프레임워크에 의존하지 않음**
5. **순환 의존 금지**

ArchUnit 테스트로 CI에서 강제: `src/test/.../ArchitectureTest.java`

## 기술 스택

| 분류 | 기술 |
|---|---|
| 언어 | Java 21 |
| 프레임워크 | Spring Boot 3.x |
| ORM | JPA / Hibernate |
| 빌드 | Maven (./mvnw) 또는 Gradle (./gradlew) |
| 테스트 | JUnit 5, TestContainers, Mockito |
| 아키텍처 검증 | ArchUnit |
| 커버리지 | JaCoCo 80%+ |

## ADR 목록

| 번호 | 제목 | 상태 |
|---|---|---|
| (프로젝트 적용 시 ADR 목록 여기에 추가) | | |

## 참조

- [레이어 규칙 상세](LAYER_RULES.md)
- [자주 발생하는 함정](RED_FLAGS.md)
- [스펙 문서](specs/)
