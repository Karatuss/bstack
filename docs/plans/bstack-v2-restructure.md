# bstack v2 — 구조 개편 + 토큰 최적화 + 런타임 관측 + Ink 설치 UI

> 승인 후 이 파일을 `bstack/docs/plans/bstack-v2-restructure.md`로 이동(사용자 메모리 규칙: 플랜은 프로젝트 내부 저장).

---

## Context

bstack = Java/Spring Boot용 Claude Code harness. 현재 17 skills, CLAUDE.md 61 lines, README.md 240 lines, bash `setup`.

레퍼런스 3종 반영해 v2로 개편:
1. **Google Antigravity Agent Skills** — SKILL.md + YAML frontmatter + Progressive disclosure(When/How/Decision tree) + "scripts as black box".
2. **Karpathy 4원칙** — Think Before Coding / Simplicity First / Surgical Changes / Goal-Driven Execution.
3. **VoltAgent awesome-agent-skills** — 플랫폼 중립화. Claude Code + Codex/Cursor/Antigravity/Gemini CLI 동시 지원 = CLAUDE.md + AGENTS.md 병행.

목표: "백엔드 개발자 조직 harness"로 격상. 동료 협업 톤 + TDD 강제 + 정량 지표 + 대상 프로젝트 런타임 관측(logging/Slack) + Ink 설치 wizard.

**주의**: 원 요청 1번 링크(x.com 트윗 아티클)는 404. Antigravity 공식 docs로 대체 확인.

---

## Variant A vs B (설치 시 선택)

|  | **CLAUDE variant** | **AGENTS variant** |
|---|---|---|
| 진입 문서 | `CLAUDE.md` | `AGENTS.md` |
| 호환 에이전트 | Claude Code | Codex · Cursor · Antigravity · Gemini CLI · OpenCode |
| 스킬 디렉터리 | `.claude/skills/` | `.agents/skills/` |
| SKILL.md 포맷 | 동일(YAML frontmatter) | 동일 |

내부 skills 단일 세트. 진입 문서 + 디렉터리 레이아웃만 분기.

---

## 변경 파일 목록

### 신규
- `AGENTS.md` — CLAUDE.md 미러(진입 문서)
- `templates/AGENTS.md.template`
- `docs/STYLE_GUIDE.md` — Karpathy 4 + 동료 협업 톤 + 정량 지표 (단일 소스)
- `docs/OBSERVABILITY.md` — logback JSON, Actuator/Micrometer, Slack webhook 샘플 전체
- `skills/collaboration/SKILL.md` — 반박 권장, 근거 요구, 트레이드오프 명시, 후계자 친화
- `skills/metrics/SKILL.md` — QPS/row/join fan-out/p99 체크리스트
- `skills/observability/SKILL.md` — Spring Actuator/Micrometer/Slack alerting When-How-Decision tree
- `install/` (Ink 앱)
  - `package.json` (`ink`, `ink-select-input`, `ink-multi-select`, `chalk`, `figures`)
  - `bin/bstack-install.tsx`
  - `src/App.tsx`, `src/steps/{Welcome,VariantPicker,ModePicker,SkillPicker,Summary}.tsx`
  - `src/lib/{symlink,vendor,detectNode}.ts`, `src/theme.ts`

### 수정
- `CLAUDE.md` — 61 → ≤30 lines. 라우팅 + 핵심규칙만. 나머지 STYLE_GUIDE/RED_FLAGS 참조.
- `SKILL.md` — YAML frontmatter 추가. 라우팅 테이블 유지. CLAUDE.md와 중복 제거.
- `skills/*/SKILL.md` × 17 — YAML frontmatter + Progressive disclosure 3-섹션(When/How/Decision tree) 표준화.
- `setup` — node 탐지 후 Ink 실행, 없으면 bash fallback.
- `README.md` — 240 → ~120 lines. 5초 요약/Quick start/Variant/Skills/철학/관측.
- `templates/CLAUDE.md.template` — 축소.

### 톤 설정
- CLAUDE.md/AGENTS.md 1-liner: "런타임 응답 caveman full 기본. 문서/커밋/PR/코드는 normal."

---

## CLAUDE.md / AGENTS.md 예상 포맷 (~25 lines)

```markdown
# bstack — Java/Spring Boot harness

See @SKILL.md for skill routing.

## Core rules
- Plan before code. Wait for approval. (Except "바로 수정해줘".)
- Tests mandatory. TDD for non-trivial.
- Quantitative over vibes. Predict QPS, rows, p99 before designing.
- Colleagues disagree openly. Cite evidence.

## References
- Principles: docs/STYLE_GUIDE.md
- Anti-patterns: docs/RED_FLAGS.md
- Layer rules: docs/LAYER_RULES.md
- Observability: docs/OBSERVABILITY.md

## Runtime
- Responses: caveman full.
- Commits/PRs/code: normal prose.
```

---

## SKILL.md 표준 포맷 (Antigravity)

```markdown
---
name: persistence
description: JPA, 트랜잭션 경계, N+1, 쿼리 튜닝 요청 시 사용.
---

# /persistence

## When to use
- N+1 의심, @Transactional 경계, fetch join vs EntityGraph, HikariCP 튜닝

## How
1. 쿼리 로그 on (`spring.jpa.show-sql`, `p6spy`)
2. 실제 SQL count 측정 → 기대치 비교
3. A/B 정량 비교(row, ms)

## Decision tree
...

## References
- docs/RED_FLAGS.md#persistence
- docs/STYLE_GUIDE.md
```

---

## 신규 3 skills 요지

### `/collaboration`
- 사용자·Claude 서로 동료 전제
- 반박 권장(근거: 파일:라인, 수치, 레퍼런스)
- 불확실성 명시 허용
- 실무 균형(join-hell 회피, 후계자 친화, 과도한 추상화 금지)
- 트레이드오프(장/단/적합 맥락) 필수

### `/metrics`
- 예상 QPS(현재/3개월/1년)
- row 수(엔드포인트·쿼리별)
- join fan-out(N×M)
- 목표 p99(read/write 분리)
- SLA(가용성·에러율), 캐시 적중률
- `/persistence` `/perf` `/architect`에서 pre-condition 참조

### `/observability`
대상 프로젝트 런타임:
- **Logging**: logback-spring.xml + `logstash-logback-encoder` JSON, MDC(traceId/userId/uri)
- **Monitoring**: Actuator + `micrometer-registry-prometheus`, 서비스 메서드 `@Timed`, JVM/HikariCP/HTTP 대시보드
- **Slack alerting**: 옵션1 Alertmanager→webhook(추천) / 옵션2 앱 내 `WebClient` `SlackNotifier` + `@Async` + `ApplicationEventPublisher` + `@EventListener`, 중복 억제(`ConcurrentHashMap<fingerprint, ts>` 5분)
- **임계치 예시**: 에러율>1%/5m, p99>500ms/5m, HikariCP 대기>100ms
- SKILL.md는 언제/어떻게 + decision tree만. 코드는 `docs/OBSERVABILITY.md`.

---

## 설치 CLI (Ink)

### 흐름
1. **Welcome** — ASCII 로고 + 소개
2. **Variant** — CLAUDE / AGENTS (방향키 + Enter)
3. **Install mode** — Global symlink / Project symlink / Project vendor
4. **Skills** — 17 + 3 = 20 다중선택 체크박스(기본 전체)
5. **Summary + confirm** — 변경 경로 프리뷰 → Enter → 진행바 → 완료

### `setup` 변경
```bash
#!/usr/bin/env bash
set -e
BSTACK_DIR="$(cd "$(dirname "$0")" && pwd)"
if command -v node >/dev/null 2>&1 && node -e "process.exit(parseInt(process.versions.node) >= 18 ? 0 : 1)"; then
  cd "$BSTACK_DIR/install"
  [ ! -d node_modules ] && npm install --silent
  exec node --loader tsx bin/bstack-install.tsx "$@"
else
  exec "$BSTACK_DIR/setup.sh" "$@"
fi
```
기존 `setup` 로직은 `setup.sh`로 이동.

### 테마
Claude CLI 유사: 보라 #B794F4 primary, 청록 accent, 회색 muted. figures 아이콘(`◉`/`◯`, `▸`, `✔`).

---

## README.md 재작성 (~120 lines)

섹션 순서: 제목 + 배지 → 5초 요약 → Quick start(1 블록) → Variant 비교표 → Skills 목록(카테고리별 3열) → 철학(6항목) → 아키텍처 의존 다이어그램(축약) → 런타임 관측 → 업데이트 → MIT.

---

## 검증

1. **CLAUDE variant 전역 설치** — `./setup` → variant=CLAUDE/mode=Global/전체 → `ls ~/.claude/skills/` 20개 확인
2. **AGENTS variant 프로젝트 vendor** — `/tmp/sample-spring`에 설치 → `.agents/skills/bstack/AGENTS.md` 존재
3. **Frontmatter 파싱** — `for f in skills/*/SKILL.md; do head -5 "$f" | grep -q '^name:' || echo FAIL; done` 무출력
4. **CLAUDE.md ≤30 lines** — `wc -l CLAUDE.md`
5. **`/bstack` 실행** — 라우팅 테이블 출력, `/observability` → Actuator 가이드
6. **Caveman 응답 포맷** — 짧은 질의 답변이 full 포맷
7. **Observability 코드** — `SlackNotifier` Spring Boot 3.x sample에서 컴파일

---

## 구현 순서 & 커밋 분리 (5 unit, 태그 없이)

a. **SKILL frontmatter 일괄 + SKILL.md 표준화** — 17 skills + 루트 SKILL.md
b. **CLAUDE 슬림 + AGENTS.md + STYLE_GUIDE.md + templates** — 진입 문서 + 원칙 단일화
c. **신규 3 skills + docs/OBSERVABILITY.md** — collaboration / metrics / observability
d. **Ink installer + setup 래퍼(+ setup.sh)** — `install/` 전체
e. **README.md 재작성** — 240 → ~120 lines

각 커밋 단위 독립 빌드·검증 가능.

---

## 리스크 / 유의

- **Ink TSX 실행 오버헤드**: `tsx` loader 설치 1회(npm install). Node 18+ 없으면 자동 bash fallback → 사용자 환경 위험 낮음.
- **AGENTS variant `.agents/skills/` 실제 지원 여부**: Antigravity/Codex 레퍼런스 기준. 실제 도구별 차이는 AGENTS.md 내 주석으로 명시.
- **Caveman 런타임**: 플러그인 `~/.claude/plugins/caveman` 사전 설치 전제. 미설치 시 CLAUDE.md 1-liner가 단순 지시로 동작.
- **플랜 이동**: 사용자 메모리 규칙상 `bstack/docs/plans/bstack-v2-restructure.md`로 이동. Plan Mode 제약상 승인 후 실행(첫 작업 단계).
