# claude_agents

Twelve specialized Claude Code subagents and five skills that cover the full SDET workflow — test strategy, API and Playwright E2E test generation, contract testing, test data factories, mutation analysis, coverage gap analysis, CI failure triage, and quality gate implementation. Use them directly in Claude Code, invoke them programmatically via the npm package, or wire them into any MCP-compatible client as tools.

## Agents

Custom subagents live in `agents/`. Each is a Markdown file with YAML frontmatter that Claude
Code loads and can invoke via the `Agent` tool or by name.

### tessa-test-strategist

Designs comprehensive test strategies for features, services, or entire products. Audits
coverage across the full pyramid (unit, integration, E2E), identifies gaps, recommends tooling,
and produces a structured `TEST_STRATEGY.md`.

**File:** `agents/tessa-test-strategist.md` | **Color:** purple

---

### ambrosine-api-tester

Generates TypeScript API test suites for REST or GraphQL endpoints. Covers happy paths, error
cases, auth, schema validation, and edge cases. All external dependencies are mocked.

**File:** `agents/ambrosine-api-tester.md` | **Color:** green

---

### ernie-e2e-test-writer

Writes production-ready Playwright E2E spec files for an existing test project. Reads project
conventions, generates missing specs following the Page Object Model, and layers in axe-core
accessibility tests.

**File:** `agents/ernie-e2e-test-writer.md` | **Color:** cyan

---

### clint-ci-gatekeeper

Designs and implements CI/CD quality gates for GitHub Actions (or GitLab CI, CircleCI).
Audits the existing pipeline against a full gate taxonomy and produces ready-to-commit
workflow files.

**File:** `agents/clint-ci-gatekeeper.md` | **Color:** orange

---

### felix-failure-triage

Triages CI test failures by classifying them as regressions, flaky tests,
environment noise, or test bugs. Accepts Vitest and Playwright JSON reports plus
flakiness history. Returns a structured verdict with root cause hypotheses,
recommended owners, and a merge-block recommendation.

**File:** `agents/felix-failure-triage.md` | **Color:** red

---

### greta-coverage-analyst

Analyses V8 coverage reports and source files to surface untested business logic
ranked by risk — not just line percentage. Identifies uncovered error paths, state
transitions, and validation branches. Produces a prioritised gap report with
concrete test stubs for every CRITICAL and HIGH gap.

**File:** `agents/greta-coverage-analyst.md` | **Color:** yellow

---

### iris-insight-reporter

Interprets CI run history data and produces a concise quality health summary for
the Horus dashboard. Detects pass rate trends, coverage drift, pyramid imbalance,
and anomalies. Returns a structured JSON payload (for programmatic consumption),
an embeddable HTML snippet (for the dashboard panel), and a plain-text summary
(for Slack or PR comments).

**File:** `agents/iris-insight-reporter.md` | **Color:** blue | **Model:** haiku

---

### percy-pr-reviewer

Reviews pull request diffs touching test files and enforces ten quality engineering
standards: AAA pattern, given/when/then naming, pyramid layer compliance, mock
injection via `@horus/test-utils`, test isolation, no logic in tests, no hardcoded
waits, behavior-not-implementation assertions, assertion completeness, and test count
regression detection. Posts structured inline review comments with must-fix and
recommended categories.

**File:** `agents/percy-pr-reviewer.md` | **Color:** pink | **Model:** haiku | **Tools:** Read, Glob, Grep

---

### saxon-spec-to-test

Converts ADRs, GitHub issues, feature specs, or user stories into production-ready
Vitest test scaffolds. Reads the codebase to use correct method signatures, types,
and builders. Assigns each scenario to the right pyramid layer and generates
complete files with AAA stubs ready to fill in.

**File:** `agents/saxon-spec-to-test.md` | **Color:** purple

---

### pat-pact-contract-tester

Designs and implements consumer-driven contract tests using Pact for microservice boundaries.
Generates consumer pact files, provider verification tests, and a Pact Broker CI pipeline with
`can-i-deploy` gates. Identifies which service boundaries lack contract coverage and are at risk
of silent breakage.

**File:** `agents/pat-pact-contract-tester.md` | **Color:** purple

---

### furio-forge-test-data

Generates realistic, schema-compliant test fixtures and typed builder factories. Reads TypeScript
types, Zod/Joi schemas, Prisma models, or OpenAPI specs and produces a `faker`-backed builder
library with sensible defaults and per-test override support. Eliminates raw object literals
scattered across test files.

**File:** `agents/furio-forge-test-data.md` | **Color:** orange

---

### kurt-striker-mutation-analyst

Interprets Stryker mutation testing reports, triages surviving mutants by risk (CRITICAL / HIGH /
LOW), and generates the minimal set of targeted tests needed to kill the most dangerous survivors.
Distinguishes high-value kills (business logic, auth, validation) from acceptable survivors
(logging, trivial getters). Projects the new mutation score after kills.

**File:** `agents/kurt-striker-mutation-analyst.md` | **Color:** red

---

## Adding a New Agent

Agents are plain Markdown files with YAML frontmatter stored in `agents/`.

### 1. Create the agent file

```bash
touch agents/my-agent.md
```

### 2. Write the frontmatter and instructions

```markdown
---
name: my-agent
description: >
  One or two sentences describing what this agent does and when to invoke it.
  Be specific — Claude Code uses this text to decide when to route to the agent.
model: inherit
color: blue
tools: ["Read", "Write", "Edit", "Bash", "Glob", "Grep"]
---

You are a [role]. Your job is to [goal].

## Phase 1 — ...
```

**Frontmatter fields:**

| Field | Required | Notes |
|-------|----------|-------|
| `name` | Yes | Lowercase, hyphens only, max 64 chars |
| `description` | Yes | Used for routing; be specific, max 1024 chars |
| `model` | No | `inherit` uses the current session model; or pin a model ID |
| `color` | No | `red`, `orange`, `yellow`, `green`, `cyan`, `blue`, `purple`, `pink` |
| `tools` | No | Restrict tool access; omit to allow all tools |

### 3. Install in Claude Code

**User-level** (available in all projects):
```bash
cp agents/my-agent.md ~/.claude/agents/
```

**Project-level** (this repo only):
```bash
cp agents/my-agent.md .claude/agents/
```

Claude Code auto-discovers agents from both locations on startup.

---

## Skills

All skills live in `skills/testing/` and follow the [Agent Skills standard](https://agentskills.io/specification).

### test-architect

Designs comprehensive test strategies for services, features, or entire products. Produces a
structured test plan covering the full pyramid (unit, integration, E2E), identifies coverage gaps,
recommends tooling, and defines success criteria.

**Invoke:** `/skill:test-architect`
**Install (Claude desktop):** `skills/testing/test-architect.skill`

---

### api-test-engineer

Generates REST/GraphQL API test suites in TypeScript. Covers happy paths, error cases, auth,
schema validation, and edge cases. All external dependencies are mocked — no live services.

**Invoke:** `/skill:api-test-engineer`
**Install (Claude desktop):** `skills/testing/api-test-engineer.skill`

---

### accessibility-auditor

Audits web pages for WCAG 2.1/2.2 AA violations using axe-core with Playwright. Produces a
prioritized violation report and ready-to-run `accessibility.spec.ts`.

**Invoke:** `/skill:accessibility-auditor`
**Install (Claude desktop):** `skills/testing/accessibility-auditor.skill`

---

### ci-quality-gatekeeper

Designs and implements CI/CD quality gates for GitHub Actions (or GitLab CI, CircleCI).
Covers lint, type check, unit coverage thresholds, integration tests, E2E, security scanning,
and accessibility — all blocking, not just warning.

**Invoke:** `/skill:ci-quality-gatekeeper`
**Install (Claude desktop):** `skills/testing/ci-quality-gatekeeper.skill`

---

### playwright-qa-agent

Full-site Playwright UI QA agent. Crawls a site, discovers all significant pages and user flows,
generates a complete multi-page TypeScript test suite with Page Objects, executes the tests, and
outputs a GitHub Actions CI config.

**Invoke:** `/skill:playwright-qa-agent`

**Install (Claude desktop):** Save `skills/testing/playwright-qa-agent.skill` via the Claude desktop app.

---

## Adding a New Skill

Skills are plain directories with a `SKILL.md` file. Both Claude and Pi discover and load them
automatically.

### 1. Create the skill directory

```bash
mkdir -p skills/testing/my-skill
```

### 2. Write `SKILL.md`

```markdown
---
name: my-skill
description: >
  One or two sentences describing what this skill does and when to use it.
  Be specific — this text determines when the agent loads the skill.
---

# My Skill

Instructions for the agent go here. Include setup steps, usage patterns,
expected outputs, and any scripts or reference files to load.
```

Frontmatter rules: `name` must be lowercase with hyphens only, max 64 chars. `description` is
required and max 1024 chars. See the [Agent Skills spec](https://agentskills.io/specification)
for the full reference.

### 3. Install in Claude desktop

```bash
# Zip the skill directory into a .skill bundle
cd skills/testing
zip -r my-skill.skill my-skill/
```

Then drag `my-skill.skill` into the Claude desktop app (Settings → Skills → Install from file),
or save it via the skills panel.

### 4. Use in Pi

No extra steps — Pi auto-discovers skills from `skills/testing/` via `.pi/settings.json`. Restart
Pi and invoke with `/skill:my-skill`.

---

## npm Package

The `mcp/` directory is published as **[`@wutangbanger/claude-agents`](https://www.npmjs.com/package/@wutangbanger/claude-agents)** — a self-contained package with all agent and skill prompts bundled at build time. No file paths or separate repo checkout required.

### Programmatic use

```bash
npm install @wutangbanger/claude-agents
```

```typescript
import { runAgent, listAgents } from '@wutangbanger/claude-agents';

// Full slug or short alias
const { output } = await runAgent('felix-failure-triage', task);
const { output } = await runAgent('felix', task);
```

Reads `ANTHROPIC_API_KEY` from the environment. Override per-call via `options.apiKey`.

### MCP server (Claude Code / IDE integration)

```bash
ANTHROPIC_API_KEY=sk-... npx @wutangbanger/claude-agents
```

Or add to `.mcp.json` / `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "claude-agents": {
      "command": "npx",
      "args": ["@wutangbanger/claude-agents"],
      "env": { "ANTHROPIC_API_KEY": "sk-..." }
    }
  }
}
```

### Registered tools

| Tool                                  | Type    |
|---------------------------------------|---------|
| `tessa-test-strategist`               | Agent   |
| `ambrosine-api-tester`                | Agent   |
| `ernie-e2e-test-writer`               | Agent   |
| `clint-ci-gatekeeper`                 | Agent   |
| `felix-failure-triage`                | Agent   |
| `greta-coverage-analyst`              | Agent   |
| `iris-insight-reporter`               | Agent   |
| `percy-pr-reviewer`                   | Agent   |
| `saxon-spec-to-test`                  | Agent   |
| `pat-pact-contract-tester`            | Agent   |
| `furio-forge-test-data`               | Agent   |
| `kurt-striker-mutation-analyst`       | Agent   |
| `skill-testing-test-architect`        | Skill   |
| `skill-testing-api-test-engineer`     | Skill   |
| `skill-testing-accessibility-auditor` | Skill   |
| `skill-testing-ci-quality-gatekeeper` | Skill   |
| `skill-testing-playwright-qa-agent`   | Skill   |
| `list-agents-and-skills`              | Utility |

Every tool accepts: `task` (string, required), `model` (optional override), `max_tokens` (optional, default 8192).

Adding or editing agents/skills requires rebuilding and republishing the package (`npm run build && npm publish --access public` from `mcp/`).

---

## Pi Integration

This repo supports [Pi coding agent](https://pi.dev) out of the box.

```bash
npm install -g --ignore-scripts @earendil-works/pi-coding-agent
export ANTHROPIC_API_KEY=your_key
cd claude_agents
pi
```

All skills are auto-discovered from `skills/testing/` via `.pi/settings.json`. Invoke any skill
with `/skill:<name>`.

## Structure

```
.pi/
  settings.json               # Pi config
AGENTS.md                     # Repo context for Pi and other coding agents
agents/
  tessa-test-strategist.md    # Test strategy designer
  ambrosine-api-tester.md     # API test suite generator
  ernie-e2e-test-writer.md    # Playwright E2E spec writer
  clint-ci-gatekeeper.md      # CI/CD quality gate implementer
  felix-failure-triage.md     # CI failure classifier and triage reporter
  greta-coverage-analyst.md   # Risk-ranked coverage gap analyst
  iris-insight-reporter.md    # CI history quality health reporter (JSON + HTML + plain-text)
  percy-pr-reviewer.md        # Test code PR reviewer (10 standards enforced)
  saxon-spec-to-test.md       # Spec-to-test scaffold generator
  pat-pact-contract-tester.md     # Consumer-driven contract tests via Pact
  furio-forge-test-data.md        # Test fixture and builder factory generator
  kurt-striker-mutation-analyst.md # Stryker mutation report analyst and kill-test generator
mcp/                          # Published as @wutangbanger/claude-agents
  scripts/
    bundle-prompts.mjs        # Prebuild: reads agents/ + skills/, emits src/generated/prompts.ts
  src/
    index.ts                  # Package entry: exports runAgent(), listAgents(), types
    api.ts                    # runAgent() implementation (Anthropic SDK)
    registry.ts               # Lookup/list over bundled prompts + SLUG_ALIASES
    types.ts                  # Shared interfaces (AgentDef, AgentResult, AgentOptions, …)
    mcp.ts                    # MCP server entry point (bin: claude-agents-mcp)
    generated/                # Auto-generated by bundle-prompts.mjs — gitignored
  package.json
  tsconfig.json
  README.md
skills/
  testing/
    test-architect/
      SKILL.md
    api-test-engineer/
      SKILL.md
    accessibility-auditor/
      SKILL.md
    ci-quality-gatekeeper/
      SKILL.md
    playwright-qa-agent/
      SKILL.md
      scripts/
    test-architect.skill
    api-test-engineer.skill
    accessibility-auditor.skill
    ci-quality-gatekeeper.skill
    playwright-qa-agent.skill
```
