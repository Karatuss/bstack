# bstack — Java/Spring Boot 에이전트 하네스

> Java 21과 Spring Boot 3.x를 사용하는 팀을 위한 에이전트 하네스입니다.
> Claude Code, Codex, Cursor, Antigravity에서 같은 개발 규칙과 스킬을 사용할 수 있습니다.

[한국어](README.md) · [English](README.en.md)

![skills](https://img.shields.io/badge/skills-20-B794F4) ![license](https://img.shields.io/badge/license-MIT-48BB78) ![compat](https://img.shields.io/badge/compat-Claude%20·%20Codex%20·%20Antigravity%20·%20Cursor-4FD1C5)

---

## 주요 특징

- **백엔드 스킬 20개** — 설계 · 구현 · 테스트 · 감사 · 관측 · 협업
- **CLAUDE.md / AGENTS.md 지원** — 여러 에이전트에서 동일한 규칙과 스킬 사용
- **문제 정의 기반 멀티에이전트** — 태스크 수가 아닌 독립 작업 단위 기준으로 배치
- **명확한 작업 분할 기준** — dependency DAG · 파일 소유권 · 위험 기반 리뷰
- **Ink 설치 도구** — Node 18 이상 지원, 미지원 환경에서는 bash로 자동 전환
- **Spring 런타임 관측** — Actuator · Micrometer · JSON 로그 · Slack 알림

## 빠른 시작

```bash
git clone https://github.com/Karatuss/bstack.git
cd bstack && ./setup
```

설치 과정에서 다음 항목을 선택합니다.

1. **Variant** — CLAUDE 또는 AGENTS
2. **Install mode** — Global symlink, Project symlink, Project vendor
3. **Skills** — 설치할 스킬 선택, 기본값은 전체
4. **Confirm** — 변경 경로 확인 후 설치

특정 프로젝트에 파일을 직접 복사하려면 프로젝트 경로를 지정합니다.

```bash
cd bstack && ./setup --project=/path/to/your-spring-app
```

## 설치 구성 비교

| | **CLAUDE** | **AGENTS** |
|---|---|---|
| 호환 에이전트 | Claude Code | Codex · Cursor · Antigravity · Gemini CLI · OpenCode |
| 진입 문서 | `CLAUDE.md` | `AGENTS.md` |
| 스킬 디렉터리 | `.claude/skills/` | `.agents/skills/` |
| 스킬 내용 | 동일 | 동일 |

두 구성은 진입 문서와 설치 경로만 다릅니다. 실제 스킬은 내부 `skills/` 디렉터리에서 함께 관리합니다.

## 제공하는 스킬

### 탐색 / 계획

`/brainstorming` · `/architect` · `/spec` · `/writing-plans` · `/subagent-driven`

### 도메인

`/conventions` · `/spring-core` · `/persistence` · `/api-review` · `/security` · `/test` · `/perf` · `/audit` · `/arch-guard`

### 협업 / 지표 / 관측

`/collaboration` · `/metrics` · `/observability`

### 실패 / 릴리즈

`/investigate` · `/writing-skills` · `/ship`

각 `SKILL.md`에는 YAML frontmatter와 사용 시점, 실행 방법, 판단 기준, 참고 문서가 정리되어 있습니다.

## 멀티에이전트로 작업하는 방식

`/subagent-driven`은 계획에 적힌 태스크 수만큼 에이전트를 생성하지 않습니다. 해결할 문제를 먼저 분명히 한 뒤, 서로 방해하지 않고 진행할 수 있는 작업만 나눠 맡깁니다.

### 1. 문제를 먼저 분명히 합니다

작업을 나누기 전에 다음 내용을 확인합니다.

- 관찰된 문제와 근거
- 목표와 비목표
- 자동 검증 가능한 성공 기준
- 성능, 호환성, 보안, 변경 금지 영역
- 구현 방향에 영향을 주는 불확실성

완료 여부를 판단할 수 없거나 구현 방향을 바꿀 만한 불확실성이 남아 있다면 바로 에이전트를 만들지 않습니다. 필요한 조사나 범위 합의를 먼저 진행합니다.

### 2. 작업 단위를 나눕니다

작업 단위(work unit)는 한 에이전트가 하나의 컨텍스트 안에서 구현부터 검증까지 끝낼 수 있는 범위로 잡습니다.

- 같은 실행 단계(wave)에서 동일한 파일이나 공통 계약을 수정한다면 하나로 합치거나 순서대로 실행합니다.
- 따로 검증할 수 없을 만큼 작은 단계는 같은 작업 단위에 포함합니다.
- 결과와 파일 소유권, 검증 방법이 서로 독립적일 때만 분리합니다.
- 각 작업에 `dependsOn`, `ownedFiles`, `acceptanceCriteria`, `verification`, `complexity`, `risk`를 기록합니다.

### 3. 필요한 에이전트 수를 정합니다

```text
workerCount = min(
  availableConcurrencySlots - 1,
  readyWorkstreamCount,
  maxConflictFreeReadyUnitCount
)
```

전체 흐름을 조율할 coordinator 자리 하나는 항상 남겨 둡니다. 작업이 하나뿐이거나 같은 파일을 계속 수정해야 하는 경우, 앞선 작업이 끝나야 다음 작업을 시작할 수 있는 경우에는 coordinator가 직접 처리합니다. 동시에 진행할 수 있는 작업이 두 개 이상일 때만 에이전트를 병렬로 배치합니다.

### 4. 의존성 순서대로 실행하고 검토합니다

```text
문제 정의
  → 분할 sanity gate
  → dependency DAG + 파일 소유권 확정
  → 충돌 없는 ready work unit 병렬 실행
  → 통합 테스트 + 위험 기반 리뷰
  → 다음 wave
  → 전체 성공 기준 검증
```

영향이 작은 변경은 coordinator가 통합 과정에서 확인합니다. 중간 수준의 위험이 있다면 별도의 검토 에이전트 한 명을 배정합니다. 보안과 데이터 무결성처럼 서로 다른 위험을 따로 살펴야 한다면 검토 에이전트를 최대 두 명까지 배정합니다.

## 개발 원칙

1. **Think before coding** — 코드를 쓰기 전에 문제와 근거, 성공 기준부터 확인합니다.
2. **Simplicity first** — 실제로 반복되는 구조가 보이기 전에는 추상화를 서두르지 않습니다.
3. **Surgical changes** — 요청 범위를 벗어난 변경은 별도 작업으로 분리합니다.
4. **Goal-driven execution** — 모든 단계는 현재 상태를 목표에 더 가깝게 만들어야 합니다.
5. **Quantitative over vibes** — QPS, row 수, fan-out, p99 같은 수치를 설계 근거로 사용합니다.
6. **Successor-friendly** — 처음 코드를 보는 동료도 이어서 관리할 수 있는 구조를 지향합니다.

상세 원칙: [docs/STYLE_GUIDE.md](docs/STYLE_GUIDE.md)

안티패턴: [docs/RED_FLAGS.md](docs/RED_FLAGS.md)

## 런타임 관측

`/observability`와 [docs/OBSERVABILITY.md](docs/OBSERVABILITY.md)에서 Spring 프로젝트의 로그, 모니터링, 알림 구성을 확인할 수 있습니다.

- **로깅** — `logback-spring.xml`, `logstash-logback-encoder`, MDC
- **모니터링** — Actuator, Micrometer, Prometheus, JVM/HikariCP/HTTP 대시보드
- **알림** — Alertmanager → Slack webhook 또는 애플리케이션 내부 `SlackNotifier`

기본 임계치 예시: 에러율 `> 1%/5m`, p99 `> 500ms/5m`, HikariCP 대기 `> 100ms`.

## 아키텍처 제약

```text
Presentation → Application → Domain
Infrastructure → Domain
```

`/arch-guard`와 ArchUnit 테스트로 다음과 같은 구조 위반을 확인합니다.

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

vendor 방식으로 설치했다면 대상 프로젝트 경로를 지정해 `./setup --project=...`을 다시 실행합니다.

## 라이선스

MIT. 자세한 내용은 [LICENSE](LICENSE)를 확인하세요.
