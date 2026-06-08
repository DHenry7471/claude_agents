# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

A collection of Claude Code agents and skills for quality engineering (SDET) workflows. It has four independently usable surfaces:

1. **`agents/`** — Markdown files with YAML frontmatter that Claude Code loads as subagents via the `Agent` tool. Interactive, tool-enabled, designed for developers in the terminal.
2. **`agents/horus/`** — Horus API variants (`horus: true`). Single-shot, no tool calls, JSON-in / JSON-out. Designed for Horus automation pipelines. Use `runHorusAgent()` to call them.
3. **`skills/testing/`** — Skill directories (`SKILL.md` + optional scripts) loadable in Claude desktop or Pi.
4. **`mcp/`** — A Node.js MCP server that wraps every agent and skill as a callable tool via the Anthropic API.

### Standard agents vs. Horus agents

| | Standard (`agents/*.md`) | Horus (`agents/horus/*.md`) |
|---|---|---|
| Tool access | Yes (Read, Bash, Glob…) | None — data is pre-packed in the message |
| Input | Interactive / freeform text | JSON object serialised to a string |
| Output | Markdown prose + files | Single JSON code block, always |
| Invoke with | `runAgent()` | `runHorusAgent()` |
| MCP tool input | `task` (string) | `input` (JSON string) |

### shared/ — contracts and insight-store

`shared/contracts/` contains TypeScript input/output types for every Horus agent. Import them from the published package (`@wutangbanger/claude-agents/contracts`) or directly from the repo.

`shared/insight-store/` defines the `InsightRecord` / `InsightStore` persistence contract. Implement `InsightStore` with any backend (Postgres, DynamoDB, SQLite).

## Package (`mcp/`)

The `mcp/` directory is published as the `claude-agents` npm package. It has two entry points:

| Entry | Purpose |
|---|---|
| `claude-agents` (default) | Exports `runAgent()`, `runHorusAgent()`, `listAgents()`, `listHorusAgents()`, `listSkills()`, `SLUG_ALIASES`, and all types |
| `claude-agents/mcp` | MCP server entry — used by the `claude-agents-mcp` bin |

### Build

Agent and skill system prompts are **bundled at build time** by `scripts/bundle-prompts.mjs`, which reads `../agents/*.md`, `../agents/horus/*.md`, and `../skills/*/SKILL.md` and emits `src/generated/prompts.ts`. Horus agents are prefixed `horus-` in the slug and flagged with `horus: true`. The build step runs this automatically:

```bash
cd mcp
pnpm install
pnpm run build          # prebuild (bundle-prompts.mjs) + tsc → dist/
```

Adding a new agent or skill requires a rebuild. The `dist/` directory is what gets published — `src/generated/` is gitignored.

### Running the MCP server

```bash
ANTHROPIC_API_KEY=sk-... pnpm start   # from compiled dist/
ANTHROPIC_API_KEY=sk-... pnpm run dev # via tsx, no build step
```

### Publishing

```bash
cd mcp
pnpm run build   # also runs automatically via prepublishOnly
pnpm publish
```

### Programmatic use (Horus)

```typescript
import { runAgent, runHorusAgent } from '@wutangbanger/claude-agents';
import type { FelixInput, FelixOutput } from '@wutangbanger/claude-agents/contracts';

// Standard agent — returns markdown prose
const { output } = await runAgent('felix-failure-triage', task);

// Horus agent — accepts typed input, returns parsed JSON
const input: FelixInput = { ciReport, gitDiff, flakinessHistory, branch, runId };
const { data } = await runHorusAgent<FelixOutput>('horus-felix', input);
// data.mergeRecommendation === 'BLOCK' | 'ALLOW'
```

## Agent file format

### Standard agents (`agents/*.md`)

```yaml
---
name: my-agent          # lowercase, hyphens, max 64 chars
description: >          # used for routing; be specific, max 1024 chars
  One or two sentences.
model: inherit          # or a pinned model ID like claude-sonnet-4-6
color: blue             # optional: red orange yellow green cyan blue purple pink
tools: ["Read", "Write", "Edit", "Bash", "Glob", "Grep"]  # omit to allow all
---

System prompt / instructions go here as the Markdown body.
```

Install for all projects: `cp agents/my-agent.md ~/.claude/agents/`
Install for this project only: `cp agents/my-agent.md .claude/agents/`

### Horus agents (`agents/horus/*.md`)

```yaml
---
name: horus-my-agent    # must start with "horus-"
description: >
  Horus API variant. One or two sentences.
model: claude-haiku-4-5-20251001  # pin a model; no "inherit"
horus: true             # required — marks this as a Horus variant
color: blue
# No tools: field — Horus agents never use tools
---

You are a Staff SDET...

## Contract
Input: { ... }  (all data pre-packed by the caller)
Output: single JSON code block conforming to MyOutput
```

Add the corresponding TypeScript types to `shared/contracts/my-agent.ts` and export from `shared/contracts/index.ts`.

## Skill file format (`skills/testing/<name>/SKILL.md`)

```yaml
---
name: my-skill          # lowercase, hyphens, max 64 chars
description: >          # required, max 1024 chars
  One or two sentences.
---

# Skill instructions go here as the Markdown body.
```

Bundle as a `.skill` zip for Claude desktop:
```bash
cd skills/testing && zip -r my-skill.skill my-skill/
```

Pi auto-discovers skills from `skills/testing/` via `.pi/settings.json` — no extra steps.

## MCP loader internals

`mcp/scripts/bundle-prompts.mjs` parses frontmatter with `gray-matter`:
- Standard agents: reads all `*.md` files in `agents/`; slug = filename without `.md`
- Horus agents: reads all `*.md` files in `agents/horus/`; slug = `horus-<filename>`; sets `horus: true`
- Skills: walks `skills/<category>/<skill-name>/SKILL.md`; slug = `skill-<category>-<skill-name>`; skips `.skill` zips
- Model falls back to `claude-sonnet-4-6` when frontmatter says `inherit`

`mcp/src/mcp.ts` registers:
- Standard agent tools — `task` (string), `model?`, `max_tokens?`
- Horus agent tools — `input` (JSON string), `model?`, `max_tokens?`
- Skill tools — `task` (string), `model?`, `max_tokens?`
- `list-agents-and-skills` introspection tool

## Quality conventions

These conventions are embedded in the agents' system prompts and should be followed in test code generated or reviewed by any agent in this repo:

- **AAA pattern**: Arrange / Act / Assert in every test
- **Given/When/Then naming** for test descriptions
- **Test pyramid**: maximize unit, mocked integration second, E2E minimal
- **Mock at the boundary**: integration tests mock external services/APIs/DBs — not internal modules
- **No logic in tests**: conditionals, loops, and helper computation belong in test utilities, not spec files
