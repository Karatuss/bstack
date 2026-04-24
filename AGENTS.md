# bstack — Java/Spring Boot harness (AGENTS variant)

플랫폼 중립 진입 문서. Codex / Cursor / Antigravity / Gemini CLI / OpenCode 호환.
Claude Code 사용자는 `CLAUDE.md`를 사용한다 — 내용은 동일.

See `@SKILL.md` for skill routing.

## Core rules

- Plan before code. Wait for approval. (Except "바로 수정해줘".)
- Tests mandatory. TDD for non-trivial.
- Quantitative over vibes. Predict QPS, rows, p99 before designing.
- Colleagues disagree openly. Cite evidence (file:line, numbers, links).
- Surgical changes. No drive-by refactors.

## References

- Principles: `docs/STYLE_GUIDE.md`
- Naming (DDD/Clean): `docs/NAMING.md`
- Anti-patterns: `docs/RED_FLAGS.md`
- Layer rules: `docs/LAYER_RULES.md`
- Observability: `docs/OBSERVABILITY.md`
- Architecture: `docs/ARCHITECTURE.md`

## Skill directory

- 기본 경로: `.agents/skills/` (Antigravity 규약).
- Codex/Cursor: 에이전트별 설정에 따라 `.agents/skills/` 또는 `agents/` 루트 심볼릭.
- Claude Code와 병행 시 `.claude/skills/` ↔ `.agents/skills/` 심볼릭으로 단일 세트 유지 가능.

## Runtime

- Responses: caveman full mode 권장 (플러그인 미지원 에이전트는 일반 prose).
- Commits, PRs, code, documentation: normal prose.
