# Changelog

All notable changes to the `@wutangbanger/claude-agents` package and this repository are
documented here. Format loosely follows [Keep a Changelog](https://keepachangelog.com/).
Versions below `3.2.0` are backfilled from git history; entries from here forward are
maintained going forward with each release.

## [3.2.1] — 2026-08-24

### Fixed
- `greta-coverage-analyst` was missing the `Write` tool despite its own instructions requiring
  it to write `COVERAGE_GAP_REPORT.md` to disk.
- `percy-pr-reviewer` was missing the `Bash` tool despite its own instructions requiring it to
  run `git diff` to fetch the PR diff.
- `horus-kurt-striker-mutation-analyst` used `model: inherit`, which the Horus contract
  (CLAUDE.md) disallows — now pinned to `claude-haiku-4-5-20251001`, matching its sibling
  Horus agents.
- `list-agents-and-skills` (MCP introspection tool) silently omitted all Horus agents from its
  output; it now lists them under their own section.
- `runAgent()` had no guard against being called with a Horus agent — it would silently send a
  freeform task string to an agent expecting a pre-packed JSON contract. It now throws and
  points the caller to `runHorusAgent()`.

### Added
- Unit test suite for `mcp/src` (`registry.test.ts`, `api.test.ts`, via Vitest) covering alias
  resolution, model precedence, Horus JSON-extraction edge cases, and error branches. Wired
  into `mcp/package.json` as `pnpm test` and into CI.
- `scripts/lint-agents.mjs` — lints every `agents/**/*.md` file for a declared-`tools` vs.
  actual-instructions mismatch (e.g. an agent told to write a file without the `Write` tool).
- `.github/workflows/repo-quality-gate.yml` — CI gate for this repo itself: builds the `mcp`
  package, runs its test suite, and runs the agent lint on every PR.

## [3.2.0] — 2026-06-08
### Added
- Five Horus API agent variants (`agents/horus/`): `horus-felix-failure-triage`,
  `horus-greta-coverage-analyst`, `horus-iris-insight-reporter`,
  `horus-kurt-striker-mutation-analyst`, `horus-percy-pr-reviewer` — single-shot, JSON-in/
  JSON-out, no tool access, designed for Horus automation pipelines.
- `runHorusAgent()` API and `shared/contracts/` TypeScript input/output types for each Horus
  agent.
- Horus-agent bundling support in `scripts/bundle-prompts.mjs`.

## [3.1.1] / [3.1.0] — 2026-06-08
- Version bumps only, no functional changes (part of the 3.0 → 3.2.0 release window).

## [3.0.0] — 2026-06-08
### Added
- `furio-forge-test-data` (test fixture/builder factory generator) and
  `pat-pact-contract-tester` (consumer-driven contract testing with Pact) agents.
- `kurt-striker-mutation-analyst` (Stryker mutation testing analysis) agent.
### Changed
- Expanded `iris-insight-reporter` and `percy-pr-reviewer` prompts.

## [2.1.0] — 2026-05-31
- Description and packaging metadata updates.

## [2.0.0] — 2026-05-31
### Changed
- Migrated package management from npm to pnpm (`mcp/pnpm-lock.yaml` replaces
  `mcp/package-lock.json`).

## [1.1.0] — 2026-05-31
### Added
- Prompt caching (`cache_control: { type: 'ephemeral' }` on the system prompt) and usage
  tracking (`AgentUsage` — input/output/cache-read/cache-creation token counts) in `runAgent()`
  and the MCP server.

## [1.0.0] — 2026-05-29
### Added
- Initial release: `agents/` standard subagents, `skills/testing/` skill directories, and the
  `mcp/` package exposing both as MCP tools with `runAgent()`/`listAgents()`/`listSkills()`.
