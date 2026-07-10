![bstack graffiti wordmark](assets/bstack-graffiti-transparent.png)

# bstack — Java/Spring Boot Agent Harness

> An agent harness for applying shared development rules and skills across Java and Spring Boot backend projects.
> The examples and detailed guidance use Java 21 and Spring Boot 3.x, but the harness itself works with other Java and Spring versions.
> Its problem-definition and multi-agent workflows can also be reused in other backend projects; only the Spring-specific skills and examples need adapting.

[한국어](README.md) · [English](README.en.md)

---

## Why bstack Was Born

Every time I worked on a project without an AI harness, I ended up rebuilding the same working agreements and documentation structure. When returning to an older project, I also had to rediscover conventions buried in its code and docs, then turn them into skills by hand.

That repeated setup was tedious, so I built bstack. The goal is simple: apply a common harness quickly, capture rediscovered project conventions as reusable skills, and carry them into the next session or project.

## Overview

- **20 backend-focused skills** — architecture · implementation · testing · auditing · observability · collaboration
- **Not tied to one stack version** — shared workflows can be reused across other Java/Spring versions and backend projects
- **CLAUDE.md / AGENTS.md support** — the same rules and skills across multiple coding agents
- **Problem-driven multi-agent execution** — allocation by independent workstream, not task count
- **Explicit decomposition rules** — dependency DAGs · file ownership · risk-based review
- **Ink-based installer** — Node 18 or later, with automatic bash fallback
- **Spring runtime observability** — Actuator · Micrometer · structured JSON logs · Slack alerts

## Quick Start

```bash
git clone https://github.com/Karatuss/bstack.git
cd bstack && ./setup
```

During setup, choose the following options.

1. **Variant** — CLAUDE or AGENTS
2. **Install mode** — Global symlink, Project symlink, or Project vendor
3. **Skills** — select skills to install; all are selected by default
4. **Confirm** — review target paths before installation

To copy bstack into a specific project, provide the project path:

```bash
cd bstack && ./setup --project=/path/to/your-spring-app
```

## Installation Variants

| | **CLAUDE** | **AGENTS** |
|---|---|---|
| Compatible agents | Claude Code | Codex · Cursor · Antigravity · Gemini CLI · OpenCode |
| Entry document | `CLAUDE.md` | `AGENTS.md` |
| Skill directory | `.claude/skills/` | `.agents/skills/` |
| Skill content | Identical | Identical |

The variants differ only in their entry document and installation path. Both use the same source files from the internal `skills/` directory.

## Included Skills

### Discovery / Planning

`/brainstorming` · `/architect` · `/spec` · `/writing-plans` · `/subagent-driven`

### Domain

`/conventions` · `/spring-core` · `/persistence` · `/api-review` · `/security` · `/test` · `/perf` · `/audit` · `/arch-guard`

### Collaboration / Metrics / Observability

`/collaboration` · `/metrics` · `/observability`

### Failure / Release

`/investigate` · `/writing-skills` · `/ship`

Each `SKILL.md` includes YAML frontmatter along with guidance on when to use the skill, how to run it, how to make key decisions, and where to find supporting material.

## How Multi-Agent Work Is Organized

`/subagent-driven` does not create one agent for every task in a plan. It starts by clarifying the problem, then delegates only the work that can proceed independently.

### 1. Start with a clear problem

Before delegating work, confirm the following:

- Observed problem and supporting evidence
- Goals and non-goals
- Automatically verifiable success criteria
- Performance, compatibility, security, and areas that must remain untouched
- Uncertainties that could change the implementation direction

If the success criteria cannot be verified, or an open question could change the implementation approach, investigate or clarify the scope before creating agents.

### 2. Define cohesive work units

A work unit should be small enough for one agent to implement and verify in a single context, while still producing a meaningful result.

- Merge or serialize work that touches the same file or shared contract in the same wave.
- Keep steps together when they cannot be verified on their own.
- Split work only when the outcome, file ownership, and verification path are independent.
- Record `dependsOn`, `ownedFiles`, `acceptanceCriteria`, `verification`, `complexity`, and `risk` for each unit.

### 3. Use only as many agents as the work needs

```text
workerCount = min(
  availableConcurrencySlots - 1,
  readyWorkstreamCount,
  maxConflictFreeReadyUnitCount
)
```

Always leave one slot available for the coordinator. The coordinator handles single units, changes centered on one file, and work with strict sequential dependencies. Parallel execution is used only when at least two workstreams can proceed independently.

### 4. Run and review work in dependency order

```text
Problem definition
  → decomposition sanity gate
  → dependency DAG + file ownership
  → execute conflict-free ready work units in parallel
  → integration tests + risk-based review
  → next wave
  → verify all success criteria
```

The coordinator reviews low-risk changes during integration. Medium-risk changes get one independent reviewer. High-risk changes may use up to two reviewers when separate concerns, such as security and data integrity, need focused attention.

## Development Principles

1. **Think before coding** — establish the problem, evidence, and success criteria before changing code.
2. **Simplicity first** — wait for real duplication before introducing an abstraction.
3. **Surgical changes** — keep unrelated changes in separate work.
4. **Goal-driven execution** — each step should move the current state closer to the intended outcome.
5. **Quantitative over vibes** — use QPS, row counts, fan-out, and p99 as design inputs.
6. **Successor-friendly** — leave code that a teammate can understand and maintain without prior context.

See [docs/STYLE_GUIDE.md](docs/STYLE_GUIDE.md) for the full set of principles.

Common anti-patterns are documented in [docs/RED_FLAGS.md](docs/RED_FLAGS.md).

## Runtime Observability

`/observability` and [docs/OBSERVABILITY.md](docs/OBSERVABILITY.md) describe how to set up logging, monitoring, and alerts in a Spring project.

- **Logging** — `logback-spring.xml`, `logstash-logback-encoder`, and MDC
- **Monitoring** — Actuator, Micrometer, Prometheus, and JVM/HikariCP/HTTP dashboards
- **Alerting** — Alertmanager → Slack webhook or an in-application `SlackNotifier`

Default threshold examples: error rate `> 1%/5m`, p99 `> 500ms/5m`, and HikariCP wait `> 100ms`.

## Architecture Constraints

```text
Presentation → Application → Domain
Infrastructure → Domain
```

`/arch-guard` and ArchUnit tests check for the following architectural violations:

- Direct Repository calls from Controllers
- Exposing Entities directly in API responses
- Declaring `@Transactional` on Controllers
- Spring framework dependencies in the Domain layer
- Circular dependencies between packages or Services

## Updating

```bash
cd ~/.claude/skills/bstack
git pull && ./setup
```

For a vendor installation, run `./setup --project=...` again with the target project path.

## License

MIT. See [LICENSE](LICENSE) for details.
