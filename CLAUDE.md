# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

A collection of Claude Code agents and skills for quality engineering (SDET) workflows. It has three independently usable surfaces:

1. **`agents/`** — Markdown files with YAML frontmatter that Claude Code loads as subagents via the `Agent` tool.
2. **`skills/testing/`** — Skill directories (`SKILL.md` + optional scripts) loadable in Claude desktop or Pi.
3. **`mcp/`** — A Node.js MCP server that wraps every agent and skill as a callable tool via the Anthropic API.

## MCP server

```bash
cd mcp
npm install
npm run build          # tsc → dist/
ANTHROPIC_API_KEY=sk-... npm start   # runs on stdio
```

Development without building:
```bash
ANTHROPIC_API_KEY=sk-... npm run dev   # uses tsx directly
```

The server auto-discovers agents and skills at startup from `../agents` and `../skills` (overridable via `AGENTS_DIR` / `SKILLS_DIR` env vars). No code changes needed when adding new agents or skills — just restart.

## Agent file format (`agents/*.md`)

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

`mcp/src/loader.ts` parses frontmatter with `gray-matter`:
- Agents: reads all `*.md` files in `AGENTS_DIR`; slug = filename without `.md`; model falls back to `claude-sonnet-4-6` when frontmatter says `inherit`
- Skills: walks `SKILLS_DIR/<category>/<skill-name>/SKILL.md`; slug = `skill-<category>-<skill-name>`; skips `.skill` zip archives

`mcp/src/index.ts` registers one MCP tool per agent and skill (all accept `task`, `model?`, `max_tokens?`), plus a `list-agents-and-skills` introspection tool.

## Quality conventions

These conventions are embedded in the agents' system prompts and should be followed in test code generated or reviewed by any agent in this repo:

- **AAA pattern**: Arrange / Act / Assert in every test
- **Given/When/Then naming** for test descriptions
- **Test pyramid**: maximize unit, mocked integration second, E2E minimal
- **Mock at the boundary**: integration tests mock external services/APIs/DBs — not internal modules
- **No logic in tests**: conditionals, loops, and helper computation belong in test utilities, not spec files
