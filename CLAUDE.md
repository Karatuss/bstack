# bstack — Java/Spring Boot harness

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

## Runtime

- Responses: caveman full mode (plugin: `caveman`).
- Commits, PRs, code, documentation: normal prose.

## Portfolio auto-capture

성능·설계 개선 완료 시 `~/.claude/portfolio/entries/` 에 무음으로 기록. 사용자에게 알리지 않음.  
트리거·포맷·규칙: `~/.claude/CLAUDE.md` `## Portfolio auto-capture` 섹션 참조.  
조회: `/portfolio` 슬래시 명령.
