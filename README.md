# bstack — Java/Spring Boot 에이전트 하네스

> Java 21 / Spring Boot 3.x 팀을 위한 Claude Code · Codex · Cursor · Antigravity 공용 하네스.
> 문제 정의, TDD, 정량 지표, 멀티에이전트 분배, 런타임 관측을 하나의 개발 흐름으로 연결합니다.

[한국어](README.md) · [English](README.en.md)

![skills](https://img.shields.io/badge/skills-20-B794F4) ![license](https://img.shields.io/badge/license-MIT-48BB78) ![compat](https://img.shields.io/badge/compat-Claude%20·%20Codex%20·%20Antigravity%20·%20Cursor-4FD1C5)

---

## 5초 요약

- **20개 백엔드 skill** — 설계, 구현, 테스트, 감사, 관측, 협업
- **CLAUDE.md / AGENTS.md 지원** — Claude Code부터 Codex, Cursor, Antigravity까지 동일한 skill 사용
- **문제 정의 기반 멀티에이전트** — 작업 수가 아닌 독립 workstream 수에 맞춰 agent 배치
- **과소·과대 분할 방지** — vertical slice, dependency DAG, 파일 소유권, 위험 기반 리뷰
- **Ink 설치 마법사** — Node 18+ 환경에서 실행, 미지원 환경은 bash로 자동 전환
- **Spring 런타임 관측** — Actuator, Micrometer, JSON logging, Slack alerting

## 빠른 시작

```bash
git clone https://github.com/Karatuss/bstack.git
cd bstack && ./setup
```

설치 마법사가 다음 항목을 설정합니다.

1. **Variant** — CLAUDE 또는 AGENTS
2. **Install mode** — Global symlink, Project symlink, Project vendor
3. **Skills** — 설치할 skill 선택, 기본값은 전체
4. **Confirm** — 변경 경로 확인 후 설치

특정 프로젝트에 vendor 방식으로 설치:

```bash
cd bstack && ./setup --project=/path/to/your-spring-app
```

## Variant 비교

| | **CLAUDE** | **AGENTS** |
|---|---|---|
| 호환 에이전트 | Claude Code | Codex · Cursor · Antigravity · Gemini CLI · OpenCode |
| 진입 문서 | `CLAUDE.md` | `AGENTS.md` |
| skill 디렉터리 | `.claude/skills/` | `.agents/skills/` |
| skill 내용 | 동일 | 동일 |

두 variant는 진입 문서와 설치 경로만 다릅니다. 내부 `skills/`는 단일 소스로 관리합니다.

## Skills

### 탐색 / 계획

`/brainstorming` · `/architect` · `/spec` · `/writing-plans` · `/subagent-driven`

### 도메인

`/conventions` · `/spring-core` · `/persistence` · `/api-review` · `/security` · `/test` · `/perf` · `/audit` · `/arch-guard`

### 협업 / 지표 / 관측

`/collaboration` · `/metrics` · `/observability`

### 실패 / 릴리즈

`/investigate` · `/writing-skills` · `/ship`

각 `SKILL.md`는 YAML frontmatter와 `When`, `How`, `Decision tree`, `References` 구조를 사용합니다.

## 멀티에이전트 실행

`/subagent-driven`은 계획의 태스크 수만큼 agent를 생성하지 않습니다. 먼저 문제를 확정하고, 독립 실행 가능한 work unit만 분배합니다.

### 1. 문제 정의

분배 전 다음 항목을 확정합니다.

- 관찰된 문제와 근거
- 목표와 비목표
- 자동 검증 가능한 성공 기준
- 성능, 호환성, 보안, 변경 금지 영역
- 구현 방향에 영향을 주는 불확실성

성공 기준을 검증할 수 없거나 핵심 불확실성이 남으면 agent를 생성하지 않습니다. 조사 또는 범위 확정을 먼저 진행합니다.

### 2. Work unit 분해

work unit은 한 agent가 하나의 컨텍스트에서 구현하고 검증할 수 있는 응집된 vertical slice입니다.

- 같은 wave에서 동일 파일이나 공유 계약을 수정하면 병합 또는 순차 실행
- 단독 검증할 수 없는 작은 단계는 병합
- 독립된 결과, 파일 소유권, 검증 경로가 있으면 분리
- `dependsOn`, `ownedFiles`, `acceptanceCriteria`, `verification`, `complexity`, `risk` 명시

### 3. Agent 수 산정

```text
workerCount = min(
  availableConcurrencySlots - 1,
  readyWorkstreamCount,
  maxConflictFreeReadyUnitCount
)
```

coordinator 슬롯 1개를 항상 보존합니다. 단일 작업, 동일 파일 중심 변경, 강한 순차 의존 작업은 coordinator가 직접 처리합니다. 독립 workstream이 2개 이상일 때만 병렬화합니다.

### 4. Wave 실행과 리뷰

```text
문제 정의
  → 분할 sanity gate
  → dependency DAG + 파일 소유권 확정
  → 충돌 없는 ready work unit 병렬 실행
  → 통합 테스트 + 위험 기반 리뷰
  → 다음 wave
  → 전체 성공 기준 검증
```

저위험 변경은 coordinator가 통합 리뷰합니다. 중위험은 독립 reviewer 1명, 고위험은 실패 축에 따라 최대 2명의 reviewer를 사용합니다.

## 개발 원칙

1. **Think before coding** — 문제, 근거, 성공 기준을 먼저 확정
2. **Simplicity first** — 실제 중복이 나타나기 전 추상화 금지
3. **Surgical changes** — 요청 범위 밖 변경은 분리
4. **Goal-driven execution** — 각 단계가 목표와 현재 상태의 차이를 줄여야 함
5. **Quantitative over vibes** — QPS, row, fan-out, p99를 근거로 설계
6. **Successor-friendly** — 처음 보는 동료가 이어받을 수 있는 구조

상세 원칙: [docs/STYLE_GUIDE.md](docs/STYLE_GUIDE.md)

안티패턴: [docs/RED_FLAGS.md](docs/RED_FLAGS.md)

## 런타임 관측

`/observability`와 [docs/OBSERVABILITY.md](docs/OBSERVABILITY.md)는 대상 Spring 프로젝트에 다음 구성을 제공합니다.

- **Logging** — `logback-spring.xml`, `logstash-logback-encoder`, MDC
- **Monitoring** — Actuator, Micrometer, Prometheus, JVM/HikariCP/HTTP dashboard
- **Alerting** — Alertmanager → Slack webhook 또는 애플리케이션 내부 `SlackNotifier`

기본 임계치 예시: 에러율 `> 1%/5m`, p99 `> 500ms/5m`, HikariCP 대기 `> 100ms`.

## 아키텍처 제약

```text
Presentation → Application → Domain
Infrastructure → Domain
```

다음 위반은 `/arch-guard`와 ArchUnit 테스트로 차단합니다.

- Controller에서 Repository 직접 호출
- Entity를 API 응답으로 직접 노출
- Controller에 `@Transactional` 선언
- Domain에서 Spring 프레임워크 의존
- 패키지 또는 Service 간 순환 의존

## 업데이트

```bash
cd ~/.claude/skills/bstack
git pull && ./setup
```

vendor 설치는 대상 프로젝트 경로와 함께 `./setup --project=...`을 다시 실행합니다.

## 라이선스

MIT. 자세한 내용은 [LICENSE](LICENSE)를 확인하세요.
