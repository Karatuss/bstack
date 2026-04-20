# bstack

> Backend-specialized Claude Code harness for Java 21 / Spring Boot 3.x

[English](#english) | [한국어](#한국어)

---

<a name="english"></a>

## What is bstack?

**bstack** is a Claude Code harness purpose-built for Java/Spring Boot backends.
It restructures the [gstack](https://github.com/anthropics/gstack) pattern around backend-specific complexity: transaction boundaries, module dependencies, query plans, and the Spring Security filter chain.

## Features

- **Approval workflow** — plan → user approval → implement. Claude never edits code without confirmation.
- **17 domain skills** — architect, persistence, security, test, and more — each targeting a distinct backend concern
- **CLAUDE.md template** — stays under 200 lines: context + architecture constraints + skill routing
- **ArchUnit integration** — layer rules enforced in CI, violation messages include fix instructions
- **Context Rot prevention** — test pass = one line; failures = full output
- **Cross-session state** — `docs/progress/claude-progress.json` (JSON, safer than Markdown for long tasks)
- **Global + per-project install** — symlink (instant updates) or vendor (team-pinned version)

## Structure

```
bstack/
├── SKILL.md                          # Entry point & skill routing table
├── CLAUDE.md                         # Harness README
├── setup                             # Install script
│
├── skills/
│   ├── brainstorming/SKILL.md        # Explore new feature ideas, no code yet
│   ├── architect/SKILL.md            # DDD, module boundaries, layer design
│   ├── spec/SKILL.md                 # Spec docs, ADR writing
│   ├── writing-plans/SKILL.md        # Spec → TDD execution plan
│   ├── subagent-driven/SKILL.md      # Distribute plan across sub-agents
│   ├── conventions/SKILL.md          # Check conventions before implementing
│   ├── spring-core/SKILL.md          # Beans, profiles, auto-configuration
│   ├── persistence/SKILL.md          # JPA, N+1 detection, transaction boundaries
│   ├── api-review/SKILL.md           # REST contracts, error format, versioning
│   ├── security/SKILL.md             # Spring Security, JWT, OAuth2
│   ├── test/SKILL.md                 # TestContainers, Mockito, coverage strategy
│   ├── perf/SKILL.md                 # N+1, HikariCP, async smell
│   ├── audit/SKILL.md                # Security + concurrency integrated audit
│   ├── arch-guard/SKILL.md           # ArchUnit constraint code
│   ├── investigate/SKILL.md          # Bug investigation (scope-freeze principle)
│   ├── writing-skills/SKILL.md       # failure-log → SKILL.md improvement
│   └── ship/SKILL.md                 # PR checklist, release gate
│
├── templates/
│   └── CLAUDE.md.template            # Starting point for project CLAUDE.md
│
└── docs/
    ├── ARCHITECTURE.md               # Layer structure, tech stack
    ├── LAYER_RULES.md                # Dependency rules + ArchUnit mapping
    ├── RED_FLAGS.md                  # CRITICAL/HIGH/MEDIUM/LOW trap list
    ├── specs/                        # Feature specs, ADRs
    ├── plans/                        # TDD execution plans
    ├── lessons/
    │   ├── LESSONS_LEARNED.md        # Recurring pattern log
    │   └── failure-log.json          # Bug investigation failure accumulator
    └── progress/
        └── claude-progress.json.template  # Long-task cross-session state
```

## Skill Routing

### Explore / Plan

| Request | Skill |
|---|---|
| New feature ideas, approach exploration | `/brainstorming` |
| Existing layer/module boundary review | `/architect` |
| Spec / ADR documentation | `/spec` |
| Spec → TDD execution plan | `/writing-plans` |
| Distribute plan (sub-agents) | `/subagent-driven` |

### Domain

| Request | Skill |
|---|---|
| Check conventions before implementing | `/conventions` |
| Spring Boot patterns / config | `/spring-core` |
| JPA / transactions / queries | `/persistence` |
| REST API design review | `/api-review` |
| Security / auth / authorization | `/security` |
| Test writing / strategy | `/test` |
| Performance / N+1 / async | `/perf` |
| Security + concurrency audit | `/audit` |
| ArchUnit / layer violations | `/arch-guard` |

### Failure / Feedback

| Request | Skill |
|---|---|
| "Why is this broken?" bug investigation | `/investigate` |
| failure-log → SKILL.md update | `/writing-skills` |

### Done

| Request | Skill |
|---|---|
| Pre-merge PR checklist | `/ship` |

## Install

### Global (available in all projects)

```bash
git clone https://github.com/Karatuss/bstack.git ~/works/bstack
cd ~/works/bstack && ./setup
# creates ~/.claude/skills/bstack symlink
# creates ~/.claude/skills/{architect,persistence,...} individual links
```

Or clone directly into `~/.claude/skills/`:

```bash
git clone https://github.com/Karatuss/bstack.git ~/.claude/skills/bstack
cd ~/.claude/skills/bstack && ./setup
```

### Apply to a project

**Symlink** (changes reflected instantly during development):

```bash
cd your-spring-project
mkdir -p .claude/skills
ln -s ~/.claude/skills/bstack .claude/skills/bstack
cp ~/.claude/skills/bstack/templates/CLAUDE.md.template ./CLAUDE.md
# edit CLAUDE.md for your project: name, stack, module structure
```

**Vendor** (team-shared, version-pinned):

```bash
cd ~/.claude/skills/bstack && ./setup --project=/path/to/your-project
# copies to .claude/skills/bstack/, strips git history
# auto-generates CLAUDE.md if not present
```

### Update

```bash
cd ~/works/bstack && git pull origin main
# symlink: auto-applied. vendor: re-run ./setup --project=...
```

## Usage

In a Claude Code session:

```
/bstack           — harness entry, skill routing guide
/brainstorming    — explore new feature design (no code yet)
/architect        — layer design, DDD, module boundary review
/spec             — spec docs, ADR writing
/writing-plans    — spec → TDD execution plan
/subagent-driven  — distribute plan across sub-agents
/conventions      — check conventions before implementing
/spring-core      — Spring Boot idioms, configuration
/persistence      — JPA N+1 detection, transaction boundary design
/api-review       — REST API contracts, error format, versioning
/security         — Spring Security, JWT, RBAC implementation
/test             — TestContainers setup, coverage strategy
/perf             — query performance, HikariCP, async smell
/audit            — security + concurrency integrated audit
/arch-guard       — ArchUnit layer constraint code
/investigate      — bug root-cause analysis (scope-freeze then explore)
/writing-skills   — reflect failure-log → improve SKILL.md
/ship             — pre-merge PR checklist
```

## CLAUDE.md Structure

Keep project `CLAUDE.md` **under 200 lines**. Three things only:

```
1. Project context      — stack, build commands, module structure
2. Architecture rules   — layer dependency rules, forbidden patterns
3. Skill routing table  — request type → skill mapping
```

Details live in `docs/` and `skills/`. Use `templates/CLAUDE.md.template` as the starting point.

## Architecture Principles

Dependency direction (one-way):

```
Presentation → Application → Domain
Infrastructure → Domain (implements Repository interfaces)
```

**Absolutely forbidden** (enforced in CI via ArchUnit):
- Controller accessing Repository directly
- Entity exposed as API response
- `@Transactional` declared on Controller
- Domain layer depending on `org.springframework.*`
- Circular dependencies between packages

## RED FLAGS Summary

| Severity | Example |
|---|---|
| 🔴 CRITICAL | Hardcoded JWT secret, SQL injection-vulnerable code |
| 🟠 HIGH | N+1 queries, Entity returned directly, inventory concurrency unhandled |
| 🟡 MEDIUM | `readOnly=true` not used, Mock DB instead of TestContainers |
| 🔵 LOW | `@Autowired` field injection, excessive SQL logs in tests |

Full list: [`docs/RED_FLAGS.md`](docs/RED_FLAGS.md)

## References

### Harness Patterns
- [gstack](https://github.com/anthropics/gstack) — original Claude Code harness (frontend + SDLC)
- [Claude Code Docs — Skills](https://docs.anthropic.com/en/docs/claude-code/skills) — official skills docs

### Java/Spring References
- [decebals/claude-code-java](https://github.com/decebals/claude-code-java) — Java-specialized harness, 18 reusable skills
- [Jeffallan/claude-skills](https://github.com/Jeffallan/claude-skills) — Spring Boot 3.x, Java 21, WebFlux, TestContainers
- [jdubois/dr-jskill](https://github.com/jdubois/dr-jskill) — Spring Boot core, persistence-jpa focused

### Design Principles
- [HumanLayer — Claude Code lessons](https://wikidocs.net/blog/@jaehong/9481/) — Context Rot prevention, cross-session state tracking
- [OpenAI Harness Engineering](https://openai.com/ko-KR/index/harness-engineering/) — why AGENTS.md shouldn't be an encyclopedia
- [ArchUnit](https://www.archunit.org/) — architecture constraints as test code

## Requirements

- [Claude Code](https://docs.anthropic.com/en/docs/claude-code) CLI
- Java 21+
- Spring Boot 3.x
- Maven (`./mvnw`) or Gradle (`./gradlew`)

## License

MIT

---

<a name="한국어"></a>

## bstack란?

**bstack**은 Java/Spring Boot 백엔드에 특화된 Claude Code 하네스입니다.
[gstack](https://github.com/anthropics/gstack) 패턴을 백엔드 관점으로 재설계 — 트랜잭션 경계, 모듈 의존성, 쿼리 플랜, Spring Security filter chain에 특화.

## 특징

- **코드 수정 승인 워크플로우** — 수정 요청 시 계획 제시 → 사용자 승인 → 구현 순서 강제
- **17개 도메인 스킬** — architect, persistence, security, test 등 백엔드 고유 복잡도를 각 skill로 분리
- **CLAUDE.md 템플릿** — 200줄 이하 유지, 기본 원칙 + 라우팅 + 아키텍처 제약 + docs/ 포인터
- **ArchUnit 연동** — 레이어 제약을 코드로 강제, 위반 시 에러 메시지에 수정 방법 내장
- **Context Rot 방지** — 테스트 성공은 한 줄, 실패만 상세 출력
- **세션 간 상태 추적** — `docs/progress/claude-progress.json` (Markdown보다 안전한 JSON)
- **전역/프로젝트 양방향 설치** — symlink(개발 중 즉시 반영) 또는 vendor(팀 공유)

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

## 설치

### 전역 설치 (모든 프로젝트에서 사용)

```bash
git clone https://github.com/Karatuss/bstack.git ~/works/bstack
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
mkdir -p .claude/skills
ln -s ~/.claude/skills/bstack .claude/skills/bstack
cp ~/.claude/skills/bstack/templates/CLAUDE.md.template ./CLAUDE.md
# 프로젝트명, 스택, 모듈 구조에 맞게 편집
```

**Vendor 방식** (팀 공유, 버전 고정):

```bash
cd ~/.claude/skills/bstack && ./setup --project=/path/to/your-project
# .claude/skills/bstack/ 에 복사 + git 히스토리 제거
# CLAUDE.md 없으면 템플릿 자동 생성
```

### 업데이트

```bash
cd ~/works/bstack && git pull origin main
# symlink 방식이면 자동 반영. vendor 방식이면 ./setup --project=... 재실행.
```

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

## CLAUDE.md 구조

프로젝트 루트의 `CLAUDE.md`는 **200줄 이하**로 유지. 세 가지만 포함:

```
1. 프로젝트 컨텍스트     — 스택, 빌드 명령, 모듈 구조
2. 아키텍처 제약         — 레이어 의존성 규칙, 금지 패턴
3. 스킬 라우팅 테이블    — 요청 유형 → 스킬 매핑
```

세부 규칙은 모두 `docs/`와 `skills/`로 위임.
`templates/CLAUDE.md.template`을 시작점으로 사용.

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

## RED FLAGS 요약

| 심각도 | 예시 |
|---|---|
| 🔴 CRITICAL | 하드코딩된 JWT secret, SQL Injection 가능 코드 |
| 🟠 HIGH | N+1 쿼리, Entity 직접 반환, 재고 동시성 미처리 |
| 🟡 MEDIUM | `readOnly=true` 미사용, TestContainers 대신 Mock DB |
| 🔵 LOW | `@Autowired` 필드 주입, 테스트 SQL 로그 과다 |

전체 목록: [`docs/RED_FLAGS.md`](docs/RED_FLAGS.md)

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

## 요구 사항

- [Claude Code](https://docs.anthropic.com/ko/docs/claude-code) CLI 설치
- Java 21+
- Spring Boot 3.x
- Maven (`./mvnw`) 또는 Gradle (`./gradlew`)

## 라이선스

MIT
