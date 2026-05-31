# claude-agents

Quality engineering agents and skills for the Horus platform — published as a self-contained npm package. Agent system prompts are bundled at build time, so no external file paths or `CLAUDE_AGENTS_DIR` are needed.

## Install

```bash
npm install claude-agents
# or while the package is local:
npm install file:../claude_agents/mcp
```

## Programmatic use

```typescript
import { runAgent, listAgents } from 'claude-agents';

// Full slug or short alias both work
const { output } = await runAgent('felix-failure-triage', task);
const { output } = await runAgent('felix', task);

// With options
const { output } = await runAgent('tessa', task, {
  model: 'claude-opus-4-8',
  maxTokens: 16384,
});

// List all bundled agents
const agents = listAgents();
```

Reads `ANTHROPIC_API_KEY` from the environment. Override per-call via `options.apiKey`.

## MCP server

Run the bundled agents as MCP tools (for Claude Code / IDE integration):

```bash
ANTHROPIC_API_KEY=sk-... npx claude-agents-mcp
```

Add to `.mcp.json` or `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "claude-agents": {
      "command": "npx",
      "args": ["claude-agents-mcp"],
      "env": { "ANTHROPIC_API_KEY": "sk-..." }
    }
  }
}
```

## Build (contributors)

Agent and skill prompts are bundled at build time from `../agents/` and `../skills/`:

```bash
npm run build   # runs bundle-prompts.mjs then tsc
npm run dev     # tsx src/mcp.ts — no build step needed
```

Adding or editing agents/skills requires a rebuild before the changes appear in the package.

## Bundled agents

| Slug | Alias | Purpose |
|------|-------|---------|
| `felix-failure-triage` | `felix` | Triage CI test failures |
| `greta-coverage-analyst` | `greta` | Risk-ranked coverage gap analysis |
| `iris-insight-reporter` | `iris` | Quality health summary for the dashboard |
| `percy-pr-reviewer` | `percy` | Review test-file PRs |
| `saxon-spec-to-test` | `saxon` | Convert specs/issues into test scaffolds |
| `tessa-test-strategist` | `tessa` | Design test strategies |
| `clint-ci-gatekeeper` | `clint` | CI/CD quality gate implementation |
| `ambrosine-api-tester` | `ambrosine` | Generate API test suites |
| `ernie-e2e-test-writer` | `ernie` | Write Playwright E2E specs |

## Environment variables

| Variable | Required | Default |
|----------|----------|---------|
| `ANTHROPIC_API_KEY` | Yes | — |
| `CLAUDE_AGENTS_MODEL` | No | Each agent's configured model |
