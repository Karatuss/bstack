# /api-review — REST API 설계 검토 스킬

REST 계약, HTTP 상태코드, 에러 응답 포맷, API 버저닝을 검토하고 표준화한다.

## 진입 조건

- 새 API 엔드포인트 설계 검토
- 에러 응답 형식 통일
- API 버저닝 전략 결정
- Request/Response DTO 구조 검토
- API 문서(Swagger/OpenAPI) 정합성 확인

## REST 설계 원칙

### URL 규칙
```
# 리소스는 복수 명사
GET    /api/v1/orders          # 목록
POST   /api/v1/orders          # 생성
GET    /api/v1/orders/{id}     # 단건 조회
PUT    /api/v1/orders/{id}     # 전체 수정
PATCH  /api/v1/orders/{id}     # 부분 수정
DELETE /api/v1/orders/{id}     # 삭제

# 중첩 리소스 (관계 명확할 때만)
GET    /api/v1/orders/{id}/items

# 동사는 서브리소스로
POST   /api/v1/orders/{id}/cancel   # 상태 변경 액션
```

### HTTP 상태코드

| 코드 | 사용 시점 |
|---|---|
| 200 | 조회/수정 성공 |
| 201 | 생성 성공 (`Location` 헤더 포함) |
| 204 | 삭제 성공 (바디 없음) |
| 400 | 입력값 유효성 오류 |
| 401 | 인증 필요 (토큰 없음/만료) |
| 403 | 권한 없음 (인증은 됐지만 접근 불가) |
| 404 | 리소스 없음 |
| 409 | 충돌 (중복 생성 등) |
| 422 | 비즈니스 규칙 위반 |
| 500 | 서버 내부 오류 |

### 표준 에러 응답
```json
{
  "code": "ORDER_NOT_FOUND",
  "message": "주문을 찾을 수 없습니다.",
  "timestamp": "2024-01-01T12:00:00Z",
  "path": "/api/v1/orders/999"
}
```

### 유효성 오류 응답 (400)
```json
{
  "code": "VALIDATION_FAILED",
  "message": "입력값 오류",
  "errors": [
    {"field": "email", "message": "올바른 이메일 형식이 아닙니다."},
    {"field": "amount", "message": "금액은 0보다 커야 합니다."}
  ]
}
```

## API 버저닝

```java
// URL 버저닝 (권장 - 명시적)
@RequestMapping("/api/v1/orders")

// Header 버저닝 (API 게이트웨이 환경)
@RequestMapping(value = "/api/orders", headers = "API-Version=1")
```

## DTO 설계

```java
// Request: 입력값 검증 포함
public record CreateOrderRequest(
    @NotNull @Positive Long productId,
    @NotNull @Min(1) Integer quantity,
    @NotBlank String deliveryAddress
) {}

// Response: Entity 직접 노출 금지
public record OrderResponse(
    Long id,
    String status,
    List<OrderItemResponse> items,
    LocalDateTime createdAt
) {
    public static OrderResponse from(Order order) { ... }
}
```

## 체크리스트

- [ ] URL이 리소스 중심 (동사 없음)
- [ ] 상태코드가 의미에 맞게 사용
- [ ] 에러 응답 형식 통일
- [ ] Entity가 Response에 직접 노출되지 않음
- [ ] 페이징 응답에 `totalElements`, `totalPages` 포함
- [ ] `@Valid` 또는 `@Validated`로 입력값 검증
- [ ] OpenAPI/Swagger 어노테이션 업데이트
