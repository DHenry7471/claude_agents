# claude_agents

A collection of Claude Code subagents and skills for quality engineering workflows, covering
the full SDET workflow across the test pyramid.

## Structure

```
agents/                          # Claude Code subagents (12 total)
skills/
  testing/                       # Loadable skills (5 total)
    playwright-qa-agent/
    test-architect/
    api-test-engineer/
    accessibility-auditor/
    ci-quality-gatekeeper/
mcp/                             # npm package: @wutangbanger/claude-agents
```

## Agents

| Agent | Short alias | Purpose |
|-------|-------------|---------|
| `tessa-test-strategist` | `tessa` | Designs test strategies across the full pyramid; produces `TEST_STRATEGY.md` |
| `ambrosine-api-tester` | `ambrosine` | Generates TypeScript REST/GraphQL test suites with mocked deps and schema validation |
| `ernie-e2e-test-writer` | `ernie` | Writes Playwright E2E spec files using Page Object Model; adds axe-core a11y tests |
| `clint-ci-gatekeeper` | `clint` | Designs and implements CI/CD quality gates for GitHub Actions and equivalents |
| `felix-failure-triage` | `felix` | Classifies CI failures as regressions, flaky, env noise, or test bugs; recommends merge-block |
| `greta-coverage-analyst` | `greta` | Ranks uncovered business logic by risk from V8 reports; produces gap report with test stubs |
| `iris-insight-reporter` | `iris` | Produces quality health JSON, dashboard HTML, and Slack summary from CI run history |
| `percy-pr-reviewer` | `percy` | Reviews test diffs against 10 standards; posts must-fix and recommended inline comments |
| `saxon-spec-to-test` | `saxon` | Converts ADRs, issues, or user stories into Vitest test scaffolds with AAA stubs |
| `pat-pact-contract-tester` | `pat` | Generates Pact consumer/provider contract tests and Pact Broker CI pipeline |
| `furio-forge-test-data` | `furio` | Generates typed faker-backed builder factories from TypeScript types, Zod schemas, or Prisma models |
| `kurt-striker-mutation-analyst` | `kurt` | Triages Stryker mutation survivors by risk and generates targeted kill tests |

## Skills

| Skill | Purpose |
|-------|---------|
| `playwright-qa-agent` | Crawls a site, generates a full TypeScript UI test suite with Page Objects, runs tests, outputs CI config |
| `test-architect` | Designs test strategies across the full pyramid; produces structured test plans with tooling recommendations |
| `api-test-engineer` | Generates REST/GraphQL test suites with mocked deps, schema validation, and AAA structure |
| `accessibility-auditor` | WCAG 2.1/2.2 AA audits using axe-core + Playwright; produces violation reports and automated test files |
| `ci-quality-gatekeeper` | Designs and implements CI quality gates (lint, coverage, E2E, security, a11y) for GitHub Actions and equivalents |

## Conventions

- Test code follows AAA (Arrange-Act-Assert) pattern
- Given/When/Then naming for test descriptions
- Test pyramid: maximize unit, then mocked integration, minimize E2E
- Integration tests mock all external dependencies — no live services
- Treat test code as production code: OOP patterns, no logic in tests

## Provider

Anthropic Claude. Set `ANTHROPIC_API_KEY` before running.

## Running Pi

```bash
npm install -g --ignore-scripts @earendil-works/pi-coding-agent
export ANTHROPIC_API_KEY=your_key
pi
```

Invoke a skill: `/skill:test-architect`, `/skill:api-test-engineer`, etc.
