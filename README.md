# bstack — Backend-Specialized Claude Code Harness

> Java 21 / Spring Boot 3.x 팀을 위한 Claude Code · Codex · Antigravity 공용 하네스.
> 동료 조직처럼 일하도록 설계: TDD + 정량 지표 + 런타임 관측 + 후계자 친화.

[English](#english) · [한국어](README.ko.md)

![skills](https://img.shields.io/badge/skills-20-B794F4) ![license](https://img.shields.io/badge/license-MIT-48BB78) ![compat](https://img.shields.io/badge/compat-Claude%20·%20Codex%20·%20Antigravity%20·%20Cursor-4FD1C5)

---

## 5초 요약

- **20개 백엔드 skills** — 설계 · 구현 · 감사 · 관측 · 협업
- **CLAUDE.md / AGENTS.md 동시 지원** — Claude Code 외 Codex/Cursor/Antigravity/Gemini CLI 호환
- **Ink 설치 마법사** — 보라 테마의 pretty wizard (Node 18+), 없으면 bash 자동 폴백
- **Karpathy 4원칙 + 동료 협업 톤** — 반박 권장, 근거 요구, 트레이드오프 강제
- **대상 프로젝트 런타임 관측 내장** — Spring Actuator + Micrometer + logback JSON + Slack

## Quick start

```bash
git clone https://github.com/Karatuss/bstack.git
cd bstack && ./setup
```

설치 마법사가 다음을 묻는다:

1. **Variant** — CLAUDE (Claude Code) / AGENTS (Codex · Cursor · Antigravity · Gemini CLI)
2. **Install mode** — Global symlink / Project symlink / Project vendor
3. **Skills** — 20개 다중선택 (기본 전체)
4. **Confirm** — 변경 경로 프리뷰 후 Enter

```bash
# 특정 프로젝트 vendor 모드
cd bstack && ./setup --project=/path/to/your-spring-app
```

## Variant 비교

|  | **CLAUDE** | **AGENTS** |
|---|---|---|
| 호환 에이전트 | Claude Code | Codex · Cursor · Antigravity · Gemini CLI · OpenCode |
| 진입 문서 | `CLAUDE.md` | `AGENTS.md` |
| 스킬 디렉터리 | `.claude/skills/` | `.agents/skills/` |
| 스킬 내용 | 동일 | 동일 |

두 variant는 **진입 문서 + 레이아웃만** 다르다. 내부 스킬은 단일 세트.

## Skills (20)

### 탐색 / 계획
`/brainstorming` · `/architect` · `/spec` · `/writing-plans` · `/subagent-driven`

### 도메인
`/conventions` · `/spring-core` · `/persistence` · `/api-review` · `/security` · `/test` · `/perf` · `/audit` · `/arch-guard`

### 협업 · 지표 · 관측
`/collaboration` · `/metrics` · `/observability`

### 실패 / 릴리즈
`/investigate` · `/writing-skills` · `/ship`

각 SKILL.md에 YAML frontmatter(name/description) + When / How / Decision tree + References 블록으로 progressive disclosure 표준 ([Antigravity Agent Skills](https://antigravity.google/docs/skills) 패턴).

## 철학

1. **Think before coding** — 문제 재진술 → 성공 기준 → 그 다음 코드
2. **Simplicity first** — 두 번째 중복 나타날 때까지 추상화 금지
3. **Surgical changes** — 요청 범위 밖 리팩토링은 별도 커밋
4. **Goal-driven** — 각 단계가 목표 gap을 얼마나 좁히는지 측정
5. **Quantitative over vibes** — QPS · row · fan-out · p99 예측 없이 설계 금지
6. **Successor-friendly** — 3개월 뒤 처음 보는 동료가 이어받을 수 있는 구조

원칙 상세: [docs/STYLE_GUIDE.md](docs/STYLE_GUIDE.md).
안티패턴: [docs/RED_FLAGS.md](docs/RED_FLAGS.md).

## 런타임 관측

`/observability` 스킬 + [docs/OBSERVABILITY.md](docs/OBSERVABILITY.md)가 대상 프로젝트에 **logging · monitoring · Slack alerting** 설정을 제공한다.

- **Logging**: logback-spring.xml + `logstash-logback-encoder` JSON, MDC(traceId/userId/uri)
- **Monitoring**: Actuator + `micrometer-registry-prometheus`, JVM/HikariCP/HTTP 대시보드 3종
- **Alerting**: Alertmanager → Slack webhook (추천) / 앱 내 `SlackNotifier` + `@EventListener` + fingerprint dedup

임계치 예시: 에러율 > 1%/5m, p99 > 500ms/5m, HikariCP 대기 > 100ms.

## 아키텍처 의존성

```
Domain → Repository(interface) → Service → Controller
```

Controller→Repository 직접 접근, Entity→API 직접 노출, Controller `@Transactional` 은 ArchUnit 이 CI에서 차단. 위반 시 `/arch-guard`.

## 업데이트

```bash
cd ~/.claude/skills/bstack   # 전역 설치 경로
git pull && ./setup          # wizard 가 기존 설정 감지 후 필요한 변경만 수행
```

## License

MIT. See [LICENSE](LICENSE).

---

<a name="english"></a>
## English

bstack is a Claude Code / Codex / Antigravity harness for Java 21 + Spring Boot 3.x teams.
20 skills, dual variant (CLAUDE.md or AGENTS.md), Ink-based install wizard, Karpathy 4-principles, and a runtime observability guide.

Install: `git clone … && cd bstack && ./setup` (Korean docs above cover the full flow).
