---
name: bstack
description: Backend-Specialized Claude Code Harness — Java/Spring Boot 프로젝트용 스킬 라우팅 진입점. /bstack 실행 시 로드.
---

# bstack — Backend-Specialized Claude Code Harness

Java/Spring Boot 백엔드 프로젝트를 위한 Claude Code 하네스.
gstack 패턴을 백엔드 관점으로 재설계: 트랜잭션 경계, 모듈 의존성, 쿼리 플랜, Spring Security filter chain에 특화.

## 사용 방법

이 SKILL.md가 보인다면 `/bstack`으로 진입한 것입니다.
아래 라우팅 테이블을 보고 적합한 스킬을 선택하세요.

**중요**: 스킬 호출 전 반드시 `docs/ARCHITECTURE.md`와 관련 `docs/specs/`를 먼저 읽으세요.

---

## 스킬 라우팅

### 탐색 / 계획 단계

| 요청 유형 | 스킬 | 진입 조건 |
|---|---|---|
| 새 기능 아이디어, 접근법 탐색 | `/brainstorming` | 처음부터 설계, 기존 코드 없음. **승인 전 코드 불가** |
| 기존 코드 레이어/모듈 경계 검토 | `/architect` | 기존 코드 있을 때, 구조 개선 논의 |
| 스펙 / ADR 문서화 | `/spec` | 설계 확정 후 공식 문서화, `docs/specs/FEAT-NNN.md` 생성 |
| 스펙 → TDD 실행 계획 | `/writing-plans` | 스펙 파일 존재 시, `docs/plans/` 생성 |
| 계획 분산 실행 | `/subagent-driven` | 계획 파일 존재 시, 태스크별 서브에이전트 |

### 도메인 스킬

| 요청 유형 | 스킬 | 진입 조건 |
|---|---|---|
| 코드 컨벤션 확인 | `/conventions` | 구현 전 항상 확인 |
| Spring Boot 패턴 / 설정 | `/spring-core` | Bean, 프로파일, 자동구성, 관용 패턴 |
| JPA / 트랜잭션 / 쿼리 | `/persistence` | N+1, 트랜잭션 경계, 쿼리 최적화 |
| REST API 설계 검토 | `/api-review` | 엔드포인트 계약, 에러 포맷, 버저닝 |
| 보안 / 인증 / 인가 | `/security` | Spring Security, JWT, OAuth2, RBAC |
| 테스트 작성 / 전략 | `/test` | TestContainers, Mockito, 커버리지 전략 |
| 성능 / N+1 / 비동기 | `/perf` | 쿼리 성능, HikariCP, 비동기 smell |
| 보안+동시성 통합 감사 | `/audit` | security + concurrency 전체 리뷰 |
| ArchUnit / 레이어 위반 | `/arch-guard` | 아키텍처 제약 테스트 작성, 위반 탐지 |

### 실패 / 피드백 루프

| 요청 유형 | 스킬 | 진입 조건 |
|---|---|---|
| 버그 탐색 | `/investigate` | 원인 불명 버그 → 완료 후 `failure-log.json` 기록 |
| 실패 → SKILL.md 업데이트 | `/writing-skills` | failure-log에 미반영 항목 존재 시 |

### 완료

| 요청 유형 | 스킬 | 진입 조건 |
|---|---|---|
| PR / 배포 전 검토 | `/ship` | 머지 전 체크리스트, 릴리즈 gate |

---

## Context Rot 방지 규칙

- 테스트 성공: 통과 건수만 한 줄로 출력 (`Tests: 42 passed`)
- 테스트 실패: 실패 케이스 전체 출력
- 빌드 성공: `BUILD SUCCESS` 한 줄
- 장기 작업: 각 단계 완료 시 `docs/progress/claude-progress.json` 갱신
- 실패 기록: `/investigate` 완료 후 `docs/lessons/failure-log.json` 항목 추가
- 스킬 개선: failure-log 미반영 항목 존재 시 `/writing-skills` 호출

---

## 아키텍처 원칙 요약

의존성 방향: `Domain → Repository(interface) → Service → Controller`

**절대 금지**:
- Controller에서 Repository 직접 호출
- Entity를 API 응답으로 직접 노출
- `@Transactional`을 Controller에 선언
- Service 간 순환 의존
- 테스트 없이 공개 API 변경

위반 시 `/arch-guard`로 ArchUnit 테스트 생성 후 CI에서 차단.
