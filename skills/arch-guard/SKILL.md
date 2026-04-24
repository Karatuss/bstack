---
name: arch-guard
description: ArchUnit으로 레이어 의존성 제약을 테스트 코드화. 위반 탐지·CI 차단·아키텍처 규칙 강제 시 사용.
---

# /arch-guard — ArchUnit 아키텍처 제약 스킬

ArchUnit 테스트를 작성하고, 레이어 위반을 탐지하며, CI에서 아키텍처 제약을 강제한다.

## When to use

- 레이어 의존성 위반 의심 또는 확인
- 새 아키텍처 제약 규칙 코드화
- ArchUnit 테스트 최초 설정
- 위반 에러 메시지 개선 (자체 수정 안내 포함)

## ArchUnit 의존성 추가

```xml
<!-- pom.xml -->
<dependency>
    <groupId>com.tngtech.archunit</groupId>
    <artifactId>archunit-junit5</artifactId>
    <version>1.3.0</version>
    <scope>test</scope>
</dependency>
```

## 기본 아키텍처 테스트

```java
@AnalyzeClasses(packages = "com.example", importOptions = ImportOption.DoNotIncludeTests.class)
class ArchitectureTest {

    // 1. 레이어 의존성 방향
    @ArchTest
    static final ArchRule layeredArchitecture = layeredArchitecture()
        .consideringOnlyDependenciesInLayers()
        .layer("Controller").definedBy("..presentation..")
        .layer("Service").definedBy("..application..")
        .layer("Persistence").definedBy("..infrastructure..")
        .layer("Domain").definedBy("..domain..")
        .whereLayer("Controller").mayOnlyBeAccessedByLayers("Controller")
        .whereLayer("Service").mayOnlyBeAccessedByLayers("Controller", "Service")
        .whereLayer("Persistence").mayOnlyBeAccessedByLayers("Service")
        .whereLayer("Domain").mayOnlyBeAccessedByLayers("Controller", "Service", "Persistence");

    // 2. Controller → Repository 직접 접근 금지
    @ArchTest
    static final ArchRule controllerShouldNotAccessRepository =
        noClasses()
            .that().resideInAPackage("..presentation..")
            .should().dependOnClassesThat()
            .resideInAPackage("..infrastructure..")
            .because("Controller는 Service를 통해서만 데이터에 접근해야 합니다. " +
                     "Service 레이어로 로직을 이동하세요.");

    // 3. Entity API 직접 노출 금지
    @ArchTest
    static final ArchRule entityShouldNotBeReturnedFromController =
        noMethods()
            .that().areDeclaredInClassesThat().resideInAPackage("..presentation..")
            .should().haveRawReturnType(
                resideInAPackage("..domain..").and(areAnnotatedWith(Entity.class)))
            .because("Entity를 직접 반환하면 내부 구조가 노출됩니다. " +
                     "Response DTO를 생성하고 변환 메서드를 추가하세요.");

    // 4. @Transactional Controller 금지
    @ArchTest
    static final ArchRule transactionalOnController =
        noClasses()
            .that().resideInAPackage("..presentation..")
            .should().beAnnotatedWith(Transactional.class)
            .orShould().containAnyMethodsThat(areAnnotatedWith(Transactional.class))
            .because("트랜잭션은 Service 레이어에서 관리해야 합니다.");

    // 5. Domain은 Spring에 의존하지 않음
    @ArchTest
    static final ArchRule domainShouldNotDependOnSpring =
        noClasses()
            .that().resideInAPackage("..domain..")
            .should().dependOnClassesThat()
            .resideInAPackage("org.springframework..")
            .because("도메인은 순수 Java여야 합니다. " +
                     "Spring 어노테이션이 필요하다면 application 또는 infrastructure 레이어로 이동하세요.");

    // 6. 순환 의존 금지
    @ArchTest
    static final ArchRule noCyclicDependencies =
        slices().matching("com.example.(*)..").should().beFreeOfCycles();
}
```

## 위반 시 자체 수정 안내 원칙

에러 메시지에 `because()` 절로 수정 방법을 직접 안내:
```java
.because("Controller는 Service를 통해서만 데이터에 접근해야 합니다. " +
         "Service 레이어로 로직을 이동하세요.")
```

에이전트(Claude)가 ArchUnit 실패 메시지를 읽고 스스로 수정할 수 있도록 명확하게 작성.

## 스킬 동작 순서

1. 현재 패키지 구조 파악
2. `src/test/.../ArchitectureTest.java` 존재 여부 확인
3. 없으면 신규 생성, 있으면 기존 파일에 규칙 추가
4. `./mvnw test -Dtest=ArchitectureTest` 실행
5. 위반 항목 목록화 및 수정 제안

## CI 통합

```yaml
# .github/workflows/ci.yml
- name: Architecture Tests
  run: ./mvnw test -Dtest=ArchitectureTest -pl [module]
```


---

## References

- docs/STYLE_GUIDE.md — 원칙 (Karpathy 4 + 동료 협업 + 정량)
- docs/RED_FLAGS.md — 안티패턴
- docs/LAYER_RULES.md — 레이어 규칙
