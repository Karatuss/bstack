# bstack — Java/Spring Boot Agent Harness

> A shared harness for Claude Code, Codex, Cursor, and Antigravity teams using Java 21 and Spring Boot 3.x.
> It connects problem definition, TDD, quantitative design, multi-agent delegation, and runtime observability into one development workflow.

[한국어](README.md) · [English](README.en.md)

![skills](https://img.shields.io/badge/skills-20-B794F4) ![license](https://img.shields.io/badge/license-MIT-48BB78) ![compat](https://img.shields.io/badge/compat-Claude%20·%20Codex%20·%20Antigravity%20·%20Cursor-4FD1C5)

---

## 5-Second Summary

- **20 backend skills** — architecture, implementation, testing, auditing, observability, and collaboration
- **CLAUDE.md / AGENTS.md support** — the same skills work across Claude Code, Codex, Cursor, and Antigravity
- **Problem-driven multi-agent execution** — agents are allocated by independent workstream count, not task count
- **Balanced decomposition** — vertical slices, dependency DAGs, file ownership, and risk-based review
- **Ink setup wizard** — runs on Node 18+ and automatically falls back to bash elsewhere
- **Spring runtime observability** — Actuator, Micrometer, JSON logging, and Slack alerting

## Quick Start

```bash
git clone https://github.com/Karatuss/bstack.git
cd bstack && ./setup
```

The setup wizard configures the following options.

1. **Variant** — CLAUDE or AGENTS
2. **Install mode** — Global symlink, Project symlink, or Project vendor
3. **Skills** — select skills to install; all are selected by default
4. **Confirm** — review target paths before installation

Install into a specific project in vendor mode:

```bash
cd bstack && ./setup --project=/path/to/your-spring-app
```

## Variant Comparison

| | **CLAUDE** | **AGENTS** |
|---|---|---|
| Compatible agents | Claude Code | Codex · Cursor · Antigravity · Gemini CLI · OpenCode |
| Entry document | `CLAUDE.md` | `AGENTS.md` |
| Skill directory | `.claude/skills/` | `.agents/skills/` |
| Skill content | Identical | Identical |

The variants differ only in their entry document and installation path. The internal `skills/` directory remains the single source of truth.

## Skills

### Discovery / Planning

`/brainstorming` · `/architect` · `/spec` · `/writing-plans` · `/subagent-driven`

### Domain

`/conventions` · `/spring-core` · `/persistence` · `/api-review` · `/security` · `/test` · `/perf` · `/audit` · `/arch-guard`

### Collaboration / Metrics / Observability

`/collaboration` · `/metrics` · `/observability`

### Failure / Release

`/investigate` · `/writing-skills` · `/ship`

Each `SKILL.md` uses YAML frontmatter and the `When`, `How`, `Decision tree`, and `References` structure.

## Multi-Agent Execution

`/subagent-driven` does not create one agent per plan task. It first defines the problem, then delegates only independently executable work units.

### 1. Define the Problem

Confirm the following before delegation.

- Observed problem and supporting evidence
- Goals and non-goals
- Automatically verifiable success criteria
- Performance, compatibility, security, and no-change constraints
- Uncertainties that could change the implementation direction

If success criteria cannot be verified or a critical uncertainty remains, do not create agents. Investigate or clarify the scope first.

### 2. Decompose Work Units

A work unit is a cohesive vertical slice that one agent can implement and verify within one context.

- Merge or serialize units that modify the same file or shared contract in the same wave
- Merge small steps that cannot be verified independently
- Split work when outcomes, file ownership, and verification paths are independent
- Record `dependsOn`, `ownedFiles`, `acceptanceCriteria`, `verification`, `complexity`, and `risk`

### 3. Calculate Agent Count

```text
workerCount = min(
  availableConcurrencySlots - 1,
  readyWorkstreamCount,
  maxConflictFreeReadyUnitCount
)
```

Always reserve one coordinator slot. The coordinator handles single units, same-file changes, and strongly sequential work directly. Parallel execution begins only when at least two independent workstreams exist.

### 4. Execute Waves and Review

```text
Problem definition
  → decomposition sanity gate
  → dependency DAG + file ownership
  → execute conflict-free ready work units in parallel
  → integration tests + risk-based review
  → next wave
  → verify all success criteria
```

The coordinator reviews low-risk changes during integration. Medium-risk changes use one independent reviewer. High-risk changes use up to two reviewers based on independent failure concerns.

## Development Principles

1. **Think before coding** — establish the problem, evidence, and success criteria first
2. **Simplicity first** — avoid abstraction until real duplication appears
3. **Surgical changes** — separate changes outside the requested scope
4. **Goal-driven execution** — every step must reduce the gap between current and desired state
5. **Quantitative over vibes** — design with QPS, rows, fan-out, and p99 evidence
6. **Successor-friendly** — build structures that a new teammate can continue maintaining

Detailed principles: [docs/STYLE_GUIDE.md](docs/STYLE_GUIDE.md)

Anti-patterns: [docs/RED_FLAGS.md](docs/RED_FLAGS.md)

## Runtime Observability

`/observability` and [docs/OBSERVABILITY.md](docs/OBSERVABILITY.md) provide the following configuration for a target Spring project.

- **Logging** — `logback-spring.xml`, `logstash-logback-encoder`, and MDC
- **Monitoring** — Actuator, Micrometer, Prometheus, and JVM/HikariCP/HTTP dashboards
- **Alerting** — Alertmanager → Slack webhook or an in-application `SlackNotifier`

Default threshold examples: error rate `> 1%/5m`, p99 `> 500ms/5m`, and HikariCP wait `> 100ms`.

## Architecture Constraints

```text
Presentation → Application → Domain
Infrastructure → Domain
```

`/arch-guard` and ArchUnit tests block the following violations.

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

For vendor installations, run `./setup --project=...` again with the target project path.

## License

MIT. See [LICENSE](LICENSE) for details.
