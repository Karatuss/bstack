# bstack

> Backend-specialized Claude Code harness for Java 21 / Spring Boot 3.x

Java/Spring Boot 백엔드 프로젝트를 위한 Claude Code 하네스.
[gstack](https://github.com/anthropics/gstack) 패턴을 백엔드 관점으로 재설계 — 트랜잭션 경계, 모듈 의존성, 쿼리 플랜, Spring Security filter chain에 특화.

---

## 특징

- **코드 수정 승인 워크플로우** — 수정 요청 시 계획 제시 → 사용자 승인 → 구현 순서 강제
- **17개 도메인 스킬** — architect, persistence, security, test 등 백엔드 고유 복잡도를 각 skill로 분리
- **CLAUDE.md 템플릿** — 200줄 이하 유지, 기본 원칙 + 라우팅 + 아키텍처 제약 + docs/ 포인터
- **ArchUnit 연동** — 레이어 제약을 코드로 강제, 위반 시 에러 메시지에 수정 방법 내장
- **Context Rot 방지** — 테스트 성공은 한 줄, 실패만 상세 출력
- **세션 간 상태 추적** — `docs/progress/claude-progress.json` (Markdown보다 안전한 JSON)
- **전역/프로젝트 양방향 설치** — symlink(개발 중 즉시 반영) 또는 vendor(팀 공유)

---

## 구조

```
bstack/
├── SKILL.md                          # 진입점 & 스킬 라우팅 테이블
├── CLAUDE.md                         # 하네스 README
├── setup                             # 설치 스크립트
│
├── skills/
│   ├── brainstorming/SKILL.md        # 새 기능 아이디어, 접근법 탐색
│   ├── architect/SKILL.md            # DDD, 모듈 경계, 레이어 설계
│   ├── spec/SKILL.md                 # 스펙 문서, ADR 작성
│   ├── writing-plans/SKILL.md        # 스펙 → TDD 실행 계획
│   ├── subagent-driven/SKILL.md      # 계획 파일 분산 실행
│   ├── conventions/SKILL.md          # 구현 전 컨벤션 확인
│   ├── spring-core/SKILL.md          # Bean, 프로파일, 자동구성
│   ├── persistence/SKILL.md          # JPA, N+1 탐지, 트랜잭션 경계
│   ├── api-review/SKILL.md           # REST 계약, 에러 포맷, 버저닝
│   ├── security/SKILL.md             # Spring Security, JWT, OAuth2
│   ├── test/SKILL.md                 # TestContainers, Mockito, 커버리지
│   ├── perf/SKILL.md                 # N+1, HikariCP, 비동기 smell
│   ├── audit/SKILL.md                # 보안 + 동시성 통합 감사
│   ├── arch-guard/SKILL.md           # ArchUnit 제약 코드화
│   ├── investigate/SKILL.md          # 버그 탐색 (스코프 freeze 원칙)
│   ├── writing-skills/SKILL.md       # failure-log → SKILL.md 업데이트
│   └── ship/SKILL.md                 # PR 체크리스트, 릴리즈 gate
│
├── templates/
│   └── CLAUDE.md.template            # 프로젝트 CLAUDE.md 시작점
│
└── docs/
    ├── ARCHITECTURE.md               # 레이어 구조, 기술 스택
    ├── LAYER_RULES.md                # 의존성 규칙 상세 + ArchUnit 연결
    ├── RED_FLAGS.md                  # CRITICAL/HIGH/MEDIUM/LOW 함정 목록
    ├── specs/                        # 기능 스펙, ADR 보관
    ├── plans/                        # TDD 실행 계획 파일
    ├── lessons/
    │   ├── LESSONS_LEARNED.md        # 반복 패턴 학습 기록
    │   └── failure-log.json          # 버그 탐색 실패 원인 누적
    └── progress/
        └── claude-progress.json.template  # 장기 작업 세션 간 상태 추적
```

---

## 스킬 라우팅

### 탐색 / 계획

| 요청 유형 | 스킬 |
|---|---|
| 새 기능 아이디어, 접근법 탐색 | `/brainstorming` |
| 기존 코드 레이어/모듈 경계 검토 | `/architect` |
| 스펙 / ADR 문서화 | `/spec` |
| 스펙 → TDD 실행 계획 | `/writing-plans` |
| 계획 분산 실행 (서브에이전트) | `/subagent-driven` |

### 도메인

| 요청 유형 | 스킬 |
|---|---|
| 구현 전 컨벤션 확인 | `/conventions` |
| Spring Boot 패턴 / 설정 | `/spring-core` |
| JPA / 트랜잭션 / 쿼리 | `/persistence` |
| REST API 설계 검토 | `/api-review` |
| 보안 / 인증 / 인가 | `/security` |
| 테스트 작성 / 전략 | `/test` |
| 성능 / N+1 / 비동기 | `/perf` |
| 보안+동시성 통합 감사 | `/audit` |
| ArchUnit / 레이어 위반 | `/arch-guard` |

### 실패 / 피드백

| 요청 유형 | 스킬 |
|---|---|
| "왜 안 되지" 버그 탐색 | `/investigate` |
| failure-log → SKILL.md 업데이트 | `/writing-skills` |

### 완료

| 요청 유형 | 스킬 |
|---|---|
| PR / 배포 전 검토 | `/ship` |

---

## 설치

### 전역 설치 (모든 프로젝트에서 사용)

```bash
# 1. 클론
git clone https://github.com/Karatuss/bstack.git ~/works/bstack

# 2. setup 스크립트 실행
cd ~/works/bstack && ./setup
# ~/.claude/skills/bstack 심볼릭링크 생성
# ~/.claude/skills/{architect,persistence,...} 개별 링크 생성
```

또는 `~/.claude/skills/`에 직접 클론:

```bash
git clone https://github.com/Karatuss/bstack.git ~/.claude/skills/bstack
cd ~/.claude/skills/bstack && ./setup
```

### 프로젝트 적용

**Symlink 방식** (개발 중 변경 즉시 반영):

```bash
cd your-spring-project

# 스킬 링크
mkdir -p .claude/skills
ln -s ~/.claude/skills/bstack .claude/skills/bstack

# CLAUDE.md 생성
cp ~/.claude/skills/bstack/templates/CLAUDE.md.template ./CLAUDE.md
# 이후 프로젝트명, 스택, 모듈 구조에 맞게 편집
```

**Vendor 방식** (팀 공유, 버전 고정):

```bash
cd ~/.claude/skills/bstack && ./setup --project=/path/to/your-project
# .claude/skills/bstack/ 에 복사 + git 히스토리 제거
# CLAUDE.md 없으면 템플릿 자동 생성
```

### 업데이트

```bash
cd ~/works/bstack
git pull origin main
# symlink 방식이면 자동 반영. vendor 방식이면 ./setup --project=... 재실행.
```

---

## 사용법

Claude Code 세션에서:

```
/bstack           — 하네스 진입, 스킬 라우팅 안내
/brainstorming    — 새 기능 설계 탐색 (코드 없을 때)
/architect        — 레이어 설계, DDD, 모듈 경계 검토
/spec             — 스펙 문서, ADR 작성
/writing-plans    — 스펙 → TDD 실행 계획 생성
/subagent-driven  — 계획 파일 서브에이전트 분산 실행
/conventions      — 구현 전 컨벤션 확인
/spring-core      — Spring Boot 관용 패턴, 설정
/persistence      — JPA N+1 탐지, 트랜잭션 경계 설계
/api-review       — REST API 계약, 에러 포맷, 버저닝
/security         — Spring Security, JWT, RBAC 구현
/test             — TestContainers 설정, 커버리지 전략
/perf             — 쿼리 성능, HikariCP, 비동기 smell
/audit            — 보안 + 동시성 통합 감사
/arch-guard       — ArchUnit 레이어 제약 코드화
/investigate      — 버그 원인 분석 (스코프 freeze 후 탐색)
/writing-skills   — failure-log 반영 → SKILL.md 개선
/ship             — PR 머지 전 체크리스트
```

---

## CLAUDE.md 구조

프로젝트 루트의 `CLAUDE.md`는 **200줄 이하**로 유지. 세 가지만 포함:

```
1. 프로젝트 컨텍스트     — 스택, 빌드 명령, 모듈 구조
2. 아키텍처 제약         — 레이어 의존성 규칙, 금지 패턴
3. 스킬 라우팅 테이블    — 요청 유형 → 스킬 매핑
```

세부 규칙은 모두 `docs/`와 `skills/`로 위임.
`templates/CLAUDE.md.template`을 시작점으로 사용.

---

## 아키텍처 원칙

의존성 방향 (단방향):

```
Presentation → Application → Domain
Infrastructure → Domain (Repository 인터페이스 구현)
```

**절대 금지** (ArchUnit으로 CI 강제):
- Controller에서 Repository 직접 접근
- Entity를 API Response로 직접 노출
- `@Transactional`을 Controller에 선언
- Domain 레이어가 `org.springframework.*`에 의존
- 패키지 간 순환 의존

---

## RED FLAGS 요약

| 심각도 | 예시 |
|---|---|
| 🔴 CRITICAL | 하드코딩된 JWT secret, SQL Injection 가능 코드 |
| 🟠 HIGH | N+1 쿼리, Entity 직접 반환, 재고 동시성 미처리 |
| 🟡 MEDIUM | `readOnly=true` 미사용, TestContainers 대신 Mock DB |
| 🔵 LOW | `@Autowired` 필드 주입, 테스트 SQL 로그 과다 |

전체 목록: [`docs/RED_FLAGS.md`](docs/RED_FLAGS.md)

---

## 관련 레퍼런스

### 하네스 패턴
- [gstack](https://github.com/anthropics/gstack) — Claude Code 하네스 원형 (frontend + SDLC 기반)
- [Claude Code Docs — Skills](https://docs.anthropic.com/ko/docs/claude-code/skills) — skills 공식 문서

### Java/Spring 특화 레퍼런스
- [decebals/claude-code-java](https://github.com/decebals/claude-code-java) — Java 특화 하네스, 18개 재사용 가능한 skills
- [Jeffallan/claude-skills](https://github.com/Jeffallan/claude-skills) — Spring Boot 3.x, Java 21, WebFlux, TestContainers 커버
- [jdubois/dr-jskill](https://github.com/jdubois/dr-jskill) — Spring Boot core, persistence-jpa 특화

### 설계 원칙
- [HumanLayer — Claude Code 실전 교훈](https://wikidocs.net/blog/@jaehong/9481/) — Context Rot 방지, 세션 간 상태 추적 패턴
- [OpenAI Harness Engineering](https://openai.com/ko-KR/index/harness-engineering/) — AGENTS.md를 백과사전으로 쓰면 안 되는 이유, 구조화된 docs/ 운영 방법
- [ArchUnit](https://www.archunit.org/) — 아키텍처 제약을 테스트 코드로 강제

---

## 요구 사항

- [Claude Code](https://docs.anthropic.com/ko/docs/claude-code) CLI 설치
- Java 21+
- Spring Boot 3.x
- Maven (`./mvnw`) 또는 Gradle (`./gradlew`)

---

## 라이선스

MIT
