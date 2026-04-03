# /test — 테스트 전략 스킬

TestContainers, Mockito, 슬라이스 테스트, 커버리지 전략을 다룬다.

## 진입 조건

- 테스트 전략 수립 (단위 vs 통합)
- TestContainers 설정
- Mockito vs 실제 의존성 판단
- 커버리지 80%+ 달성 전략
- 슬라이스 테스트 (`@WebMvcTest`, `@DataJpaTest`)

## 핵심 원칙: 무엇을 Mock하고 무엇을 실제로 쓸까

| 의존성 | 권장 방식 | 이유 |
|---|---|---|
| 데이터베이스 | TestContainers (실제) | Mock/실제 불일치로 프로덕션 버그 발생 |
| 외부 HTTP API | WireMock (Mock) | 외부 서비스 불안정성 격리 |
| 이메일/SMS | Mock | 실제 발송 방지 |
| 파일 시스템 | 임시 디렉터리 | 테스트 격리 |
| 메시지 브로커 | TestContainers (실제) | 메시지 순서/트랜잭션 검증 필요 |

## TestContainers 설정

```java
@SpringBootTest
@Testcontainers
class OrderServiceIntegrationTest {

    @Container
    static MySQLContainer<?> mysql = new MySQLContainer<>("mysql:8.4")
        .withDatabaseName("testdb")
        .withUsername("test")
        .withPassword("test");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", mysql::getJdbcUrl);
        registry.add("spring.datasource.username", mysql::getUsername);
        registry.add("spring.datasource.password", mysql::getPassword);
    }

    @Test
    void 주문_생성_성공() {
        // given / when / then
    }
}
```

## 슬라이스 테스트

```java
// Controller 레이어만 (빠름)
@WebMvcTest(OrderController.class)
class OrderControllerTest {
    @Autowired MockMvc mockMvc;
    @MockBean OrderService orderService;  // Service는 Mock

    @Test
    void 주문_조회_200() throws Exception {
        given(orderService.getOrder(1L)).willReturn(sampleOrder());
        mockMvc.perform(get("/api/v1/orders/1"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(1));
    }
}

// Repository 레이어만
@DataJpaTest
@AutoConfigureTestDatabase(replace = NONE)  // TestContainers 사용 시
class OrderRepositoryTest {
    @Autowired OrderRepository repository;
}
```

## Context Rot 방지 (테스트 출력)

```java
// application-test.yml
logging:
  level:
    org.hibernate.SQL: OFF      # 성공 시 SQL 로그 끄기
    org.testcontainers: WARN    # 컨테이너 시작 로그 최소화
```

테스트 실행 후:
- 성공: `Tests: 42 passed` (한 줄)
- 실패: 실패 케이스 스택트레이스 전체 출력

## 커버리지 전략

```xml
<!-- pom.xml JaCoCo 설정 -->
<plugin>
    <groupId>org.jacoco</groupId>
    <artifactId>jacoco-maven-plugin</artifactId>
    <configuration>
        <excludes>
            <exclude>**/*Request.class</exclude>
            <exclude>**/*Response.class</exclude>
            <exclude>**/config/**</exclude>
        </excludes>
    </configuration>
    <executions>
        <execution>
            <goals><goal>check</goal></goals>
            <configuration>
                <rules>
                    <rule>
                        <limits>
                            <limit>
                                <counter>LINE</counter>
                                <value>COVEREDRATIO</value>
                                <minimum>0.80</minimum>
                            </limit>
                        </limits>
                    </rule>
                </rules>
            </configuration>
        </execution>
    </executions>
</plugin>
```

## 테스트 명명 규칙

```java
// 한국어 설명 또는 영어 given_when_then
@Test
void 재고_부족_시_주문_생성_실패() { ... }

@Test
void createOrder_whenStockInsufficient_throwsException() { ... }
```
