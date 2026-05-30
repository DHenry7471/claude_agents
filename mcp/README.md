# claude-agents-mcp

An MCP server that exposes every agent and skill in this repo as a callable tool.

## How it works

At startup the server reads:
- `../agents/*.md` — each agent becomes a tool named after its slug (e.g. `tessa-test-strategist`)
- `../skills/<category>/<skill>/SKILL.md` — each skill becomes a tool named `skill-<category>-<skill>`

Each tool accepts a `task` string, calls the Anthropic API with the agent/skill's system prompt, and returns the result as text.

## Setup

```bash
cd mcp
npm install
npm run build
```

## Running

```bash
ANTHROPIC_API_KEY=sk-... npm start
```

Or in dev mode (no build step):

```bash
ANTHROPIC_API_KEY=sk-... npm run dev
```

## Claude Code / Cowork config

Add to your `claude_desktop_config.json` or `.mcp.json`:

```json
{
  "mcpServers": {
    "claude-agents": {
      "command": "node",
      "args": ["/path/to/claude_agents/mcp/dist/index.js"],
      "env": {
        "ANTHROPIC_API_KEY": "sk-..."
      }
    }
  }
}
```

## Tools registered

| Tool | Type | Description |
|------|------|-------------|
| `tessa-test-strategist` | Agent | Designs comprehensive test strategies |
| `ambrosine-api-tester` | Agent | Generates TypeScript API test suites |
| `clint-ci-gatekeeper` | Agent | Designs and implements CI/CD quality gates |
| `ernie-e2e-test-writer` | Agent | Writes Playwright E2E spec files |
| `skill-testing-test-architect` | Skill | Test strategy and planning |
| `skill-testing-api-test-engineer` | Skill | API test generation |
| `skill-testing-ci-quality-gatekeeper` | Skill | CI/CD gate design |
| `skill-testing-playwright-qa-agent` | Skill | Full-site Playwright QA |
| `skill-testing-accessibility-auditor` | Skill | WCAG accessibility auditing |
| `list-agents-and-skills` | Utility | Lists all registered tools with descriptions |

## Tool input schema

Every agent/skill tool accepts the same input:

```json
{
  "task": "string — what you want the agent to do",
  "model": "string (optional) — model override, e.g. claude-opus-4-6",
  "max_tokens": "number (optional) — defaults to 8192"
}
```

## Environment variables

| Variable | Required | Default |
|----------|----------|---------|
| `ANTHROPIC_API_KEY` | Yes | — |
| `AGENTS_DIR` | No | `../agents` (relative to dist/) |
| `SKILLS_DIR` | No | `../skills` (relative to dist/) |
