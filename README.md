# bstack

> Backend-specialized Claude Code harness for Java 21 / Spring Boot 3.x

[한국어](README.ko.md)

---

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
