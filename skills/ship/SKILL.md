# /ship — PR / 릴리즈 체크 스킬

머지 전 체크리스트, 릴리즈 gate, 배포 준비 상태를 검증한다.

## 진입 조건

- PR 생성 전 자체 리뷰
- 머지 전 최종 확인
- 릴리즈 태그 생성 전

## PR 머지 전 체크리스트

### 코드 품질
- [ ] `./mvnw verify` (또는 `./gradlew check`) 통과
- [ ] 커버리지 80%+ (`target/site/jacoco/index.html`)
- [ ] ArchUnit 통과 (`src/test/.../ArchitectureTest.java`)
- [ ] Checkstyle / SpotBugs 경고 없음
- [ ] 새 공개 API에 테스트 추가됨

### 설계
- [ ] Entity가 Response DTO로 직접 노출되지 않음
- [ ] Controller에 `@Transactional` 없음
- [ ] 순환 의존성 없음
- [ ] 레이어 의존성 방향 준수

### 보안
- [ ] 민감 정보(secret, password)가 코드에 하드코딩되지 않음
- [ ] 새 엔드포인트에 인증/인가 설정 추가됨
- [ ] SQL Injection 가능성 없음 (파라미터 바인딩 사용)

### API 변경 시 추가 확인
- [ ] Breaking change 여부 확인
- [ ] API 버전 업 또는 하위 호환 유지
- [ ] OpenAPI 문서 업데이트

### 문서
- [ ] 아키텍처 변경 시 `docs/ARCHITECTURE.md` 업데이트
- [ ] 새 스펙 또는 ADR이 `docs/specs/`에 추가됨
- [ ] CHANGELOG 또는 PR 설명에 변경 요약

### 데이터베이스 마이그레이션
- [ ] Flyway/Liquibase 마이그레이션 파일 추가
- [ ] 마이그레이션이 롤백 가능한 형태
- [ ] 기존 데이터에 영향 없음 확인

## 릴리즈 Gate

```bash
# 전체 검증 실행
./mvnw verify -Pintegration-test

# 커버리지 리포트 확인
open target/site/jacoco/index.html

# 의존성 취약점 스캔 (OWASP)
./mvnw dependency-check:check
```

## PR 설명 템플릿

```markdown
## 변경 사항

- [무엇을 왜 변경했는지]

## 테스트

- [ ] 단위 테스트 추가/수정
- [ ] 통합 테스트 통과
- [ ] 수동 테스트 시나리오: [설명]

## 체크리스트

- [ ] `./mvnw verify` 통과
- [ ] 커버리지 80%+
- [ ] Breaking change 없음 (있다면 설명)
- [ ] docs/ 업데이트 완료
```

## 완료 기준

모든 체크리스트 항목 통과 시 머지 준비 완료.
미통과 항목이 있으면 `/investigate` 또는 해당 스킬로 연계.
