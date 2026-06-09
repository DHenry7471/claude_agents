# @wutangbanger/claude-agents

12 Claude Code subagents + 5 Horus API agents + 5 skills for quality engineering — test strategy, API testing, Playwright E2E, contract testing, mutation analysis, CI quality gates, coverage analysis, and failure triage.

Agent and skill system prompts are bundled at build time. No file paths or `CLAUDE_AGENTS_DIR` needed.

## Install

```bash
npm install @wutangbanger/claude-agents
# or
pnpm add @wutangbanger/claude-agents
```

## Programmatic use

### Standard agents

Returns markdown prose in `output`:

```typescript
import { runAgent, listAgents } from '@wutangbanger/claude-agents';

// Full slug or short alias both work
const { output } = await runAgent('felix-failure-triage', task);
const { output } = await runAgent('felix', task);

// With options
const { output } = await runAgent('tessa', task, {
  model: 'claude-opus-4-8',
  maxTokens: 16384,
});

const agents = listAgents();
```

### Horus agents

Accepts a typed input object, returns parsed JSON in `data`:

```typescript
import { runHorusAgent, listHorusAgents } from '@wutangbanger/claude-agents';
import type { FelixInput, FelixOutput } from '@wutangbanger/claude-agents/contracts';

const input: FelixInput = {
  ciReport: vitestJsonReport,
  gitDiff: 'src/orders/orderService.ts\ntests/orders/orderService.test.ts',
  branch: 'feat/payment-refactor',
  runId: '12345',
};

const { data } = await runHorusAgent<FelixOutput>('horus-felix', input);
// data.mergeRecommendation === 'BLOCK' | 'ALLOW'
// data.failures[0].classification === 'REGRESSION' | 'FLAKY' | ...
```

Reads `ANTHROPIC_API_KEY` from the environment. Override per-call via `options.apiKey`.

## MCP server

Run all agents and skills as MCP tools (for Claude Code / IDE integration):

```bash
ANTHROPIC_API_KEY=sk-... npx @wutangbanger/claude-agents
```

Add to `.mcp.json` or `claude_desktop_config.json`:

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

## Build (contributors)

Agent and skill prompts are bundled at build time from `../agents/` and `../skills/`:

```bash
pnpm run build   # bundle-prompts.mjs + tsc → dist/
pnpm run dev     # tsx src/mcp.ts — no build step needed
```

Adding or editing agents/skills requires a rebuild before the changes appear.

## Bundled agents

### Standard agents

| Slug | Alias | Purpose |
|------|-------|---------|
| `tessa-test-strategist` | `tessa` | Design test strategies across the full pyramid |
| `ambrosine-api-tester` | `ambrosine` | Generate TypeScript REST/GraphQL test suites |
| `ernie-e2e-test-writer` | `ernie` | Write Playwright E2E specs with Page Object Model |
| `clint-ci-gatekeeper` | `clint` | Implement CI/CD quality gates for GitHub Actions |
| `felix-failure-triage` | `felix` | Triage CI test failures (regression / flaky / env / test bug) |
| `greta-coverage-analyst` | `greta` | Risk-ranked coverage gap analysis from V8 reports |
| `iris-insight-reporter` | `iris` | Quality health summary for dashboards and Slack |
| `percy-pr-reviewer` | `percy` | Review test diffs against 10 QE standards |
| `saxon-spec-to-test` | `saxon` | Convert specs/issues/ADRs into Vitest test scaffolds |
| `pat-pact-contract-tester` | `pat` | Consumer-driven contract tests via Pact |
| `furio-forge-test-data` | `furio` | Generate typed faker-backed builder factories |
| `kurt-striker-mutation-analyst` | `kurt` | Interpret Stryker mutation reports and generate kill tests |

### Horus agents (API / programmatic)

No tool access — caller pre-fetches all data and passes it as a JSON input object. Always returns a single JSON code block. Call via `runHorusAgent()`.

| Slug | Alias | Input → Output |
|------|-------|----------------|
| `horus-felix-failure-triage` | `horus-felix` | `FelixInput` → `FelixOutput` |
| `horus-greta-coverage-analyst` | `horus-greta` | `GretaInput` → `GretaOutput` |
| `horus-iris-insight-reporter` | `horus-iris` | `IrisInput` → `IrisOutput` |
| `horus-percy-pr-reviewer` | `horus-percy` | `PercyInput` → `PercyOutput` |
| `horus-kurt-striker-mutation-analyst` | `horus-kurt` | `KurtInput` → `KurtOutput` |

TypeScript contracts for all Horus inputs and outputs:

```typescript
import type {
  FelixInput, FelixOutput,
  GretaInput, GretaOutput,
  IrisInput, IrisOutput,
  PercyInput, PercyOutput,
  KurtInput, KurtOutput,
} from '@wutangbanger/claude-agents/contracts';
```

### Skills

| Slug (MCP tool) | Purpose |
|-----------------|---------|
| `skill-testing-test-architect` | Design test strategies; produce structured test plans |
| `skill-testing-api-test-engineer` | REST/GraphQL test suites with mocked deps |
| `skill-testing-accessibility-auditor` | WCAG 2.1/2.2 audits with axe-core + Playwright |
| `skill-testing-ci-quality-gatekeeper` | CI quality gates (lint, coverage, E2E, security, a11y) |
| `skill-testing-playwright-qa-agent` | Full-site Playwright UI test suite with Page Objects |

## Environment variables

| Variable | Required | Notes |
|----------|----------|-------|
| `ANTHROPIC_API_KEY` | Yes | Anthropic API key |
| `CLAUDE_AGENTS_MODEL` | No | Override model for all agents |
