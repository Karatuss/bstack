---
name: security
description: Spring Security filter chain·JWT·OAuth2·RBAC 구현. 인증/인가 설계·CORS/CSRF/XSS 방어 시 사용.
---

# /security — Spring Security / 인증 / 인가 스킬

Spring Security filter chain, JWT, OAuth2, RBAC 관련 구현과 설계를 다룬다.

## When to use

- Spring Security 설정 구조화
- JWT 발급/검증 로직 구현
- OAuth2 소셜 로그인 연동
- 역할 기반 접근 제어(RBAC) 설계
- CORS, CSRF, XSS 방어 설정
- API 엔드포인트별 접근 권한 설정

## Spring Security 6.x 기본 설정

```java
@Configuration
@EnableWebSecurity
@EnableMethodSecurity   // @PreAuthorize 활성화
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        return http
            .csrf(AbstractHttpConfigurer::disable)         // Stateless API
            .sessionManagement(s ->
                s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/v1/auth/**").permitAll()
                .requestMatchers("/actuator/health").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/public/**").permitAll()
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
            .exceptionHandling(ex -> ex
                .authenticationEntryPoint(jwtAuthEntryPoint)
                .accessDeniedHandler(jwtAccessDeniedHandler)
            )
            .build();
    }
}
```

## JWT 구현 패턴

```java
@Component
public class JwtTokenProvider {

    @Value("${jwt.secret}")
    private String secretKey;

    @Value("${jwt.expiration}")
    private long expirationMs;

    public String generateToken(Authentication authentication) {
        return Jwts.builder()
            .subject(authentication.getName())
            .issuedAt(new Date())
            .expiration(new Date(System.currentTimeMillis() + expirationMs))
            .signWith(getSigningKey())
            .compact();
    }

    public boolean validateToken(String token) {
        try {
            Jwts.parser().verifyWith(getSigningKey()).build().parseSignedClaims(token);
            return true;
        } catch (JwtException e) {
            return false;
        }
    }

    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(Decoders.BASE64.decode(secretKey));
    }
}
```

## RBAC 설계

```java
// 역할 계층 정의
@Bean
public RoleHierarchy roleHierarchy() {
    return RoleHierarchyImpl.fromHierarchy("""
        ROLE_ADMIN > ROLE_MANAGER
        ROLE_MANAGER > ROLE_USER
        """);
}

// 메서드 레벨 접근 제어
@PreAuthorize("hasRole('ADMIN')")
public void deleteUser(Long userId) { ... }

@PreAuthorize("hasRole('USER') and #userId == authentication.principal.id")
public UserProfile getMyProfile(Long userId) { ... }
```

## 보안 설정 체크리스트

- [ ] JWT secret은 환경변수로 관리 (코드에 하드코딩 금지)
- [ ] 토큰 만료 시간 설정 (Access: 15-30분, Refresh: 7-14일)
- [ ] Refresh Token은 DB 또는 Redis에 저장 (revocation 지원)
- [ ] HTTPS 전용 (`Strict-Transport-Security` 헤더)
- [ ] CORS whitelist 명시 (`*` 금지)
- [ ] Actuator 엔드포인트 접근 제한
- [ ] SQL Injection: JPA/QueryDSL 사용 (Native Query 최소화)
- [ ] XSS: Response 헤더 `X-Content-Type-Options: nosniff`
- [ ] 비밀번호: `BCryptPasswordEncoder` (strength 10+)

## 자주 발생하는 문제

| 증상 | 원인 | 해결 |
|---|---|---|
| 401 on valid token | Filter 순서 문제 | `addFilterBefore` 순서 확인 |
| CORS preflight 실패 | SecurityFilterChain에서 OPTIONS 차단 | `.requestMatchers(HttpMethod.OPTIONS).permitAll()` |
| `@PreAuthorize` 미작동 | `@EnableMethodSecurity` 누락 | 설정 클래스에 추가 |
| Self-invocation으로 권한 우회 | Spring AOP 프록시 한계 | 별도 Bean 분리 |


---

## References

- docs/STYLE_GUIDE.md — 원칙 (Karpathy 4 + 동료 협업 + 정량)
- docs/RED_FLAGS.md — 안티패턴
- docs/LAYER_RULES.md — 레이어 규칙
