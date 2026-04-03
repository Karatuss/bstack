# /spring-core — Spring Boot 관용 패턴 스킬

Spring Boot 3.x의 Bean 생명주기, 자동구성, 프로파일, 관용 패턴을 다룬다.

## 진입 조건

- Spring Bean 설정, 생명주기 이슈
- `@Configuration`, `@Conditional`, 자동구성 문제
- 프로파일(`@Profile`) 활용 방법
- 공통 설정 (CORS, 직렬화, 예외 처리) 구조화
- Spring Boot 3.x 업그레이드 이슈

## Spring Boot 3.x 핵심 패턴

### 생성자 주입 (필수)
```java
// 권장
@Service
@RequiredArgsConstructor
public class OrderService {
    private final OrderRepository orderRepository;
    private final PaymentGateway paymentGateway;
}

// 금지: @Autowired 필드 주입
```

### 예외 처리
```java
@RestControllerAdvice
public class GlobalExceptionHandler {
    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ErrorResponse> handleBusiness(BusinessException e) {
        return ResponseEntity
            .status(e.getStatus())
            .body(ErrorResponse.of(e.getCode(), e.getMessage()));
    }
}
```

### 환경별 설정 분리
```
application.yml         # 공통
application-local.yml   # 로컬 개발
application-test.yml    # 테스트 (TestContainers 등)
application-prod.yml    # 운영 (민감 정보는 환경변수)
```

### 자동구성 커스터마이징
```java
@AutoConfiguration
@ConditionalOnProperty(name = "feature.x.enabled", havingValue = "true")
public class FeatureXAutoConfiguration {
    // ...
}
```

### Actuator / 헬스체크
- `/actuator/health` 항상 활성화
- 운영 환경: `management.endpoints.web.exposure.include=health,info,metrics`
- 커스텀 헬스: `HealthIndicator` 구현

## 자주 발생하는 문제

| 증상 | 원인 | 해결 |
|---|---|---|
| `NoSuchBeanDefinitionException` | 컴포넌트 스캔 범위 밖 | `@ComponentScan` 경로 확인 |
| 순환 의존성 오류 | 설계 문제 | 레이어 분리, 이벤트 기반으로 전환 |
| 프로파일 미적용 | `spring.profiles.active` 미설정 | `application.yml` default profile 확인 |
| `LazyInitializationException` | 트랜잭션 외부에서 Lazy 로딩 | `/persistence` 스킬로 전환 |

## 출력 형식

1. 현재 코드의 anti-pattern 명시
2. 권장 패턴으로 수정된 코드 제시
3. 이유 한 줄 설명
