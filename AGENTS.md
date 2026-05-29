# claude_agents

A collection of Claude/Pi-compatible skills for quality engineering workflows, focused on SDET
tooling across the full test pyramid.

## Structure

```
.pi/
  settings.json               # Pi config (provider, model, skill paths)
skills/
  testing/
    playwright-qa-agent/      # Full-site UI QA agent (Playwright)
    test-architect/           # Test strategy and coverage design
    api-test-engineer/        # REST/GraphQL API test generation
    accessibility-auditor/    # WCAG 2.1/2.2 audit + axe-core tests
    ci-quality-gatekeeper/    # CI/CD quality gate design and implementation
```

Each skill directory contains a `SKILL.md` with `name` and `description` frontmatter per the
[Agent Skills standard](https://agentskills.io/specification).

## Skills

| Skill | Purpose |
|-------|---------|
| `playwright-qa-agent` | Crawls a site, generates a full TypeScript UI test suite with Page Objects, runs tests, outputs CI config |
| `test-architect` | Designs test strategies across the full pyramid; produces structured test plans with tooling recommendations |
| `api-test-engineer` | Generates REST/GraphQL test suites with mocked deps, schema validation, and AAA structure |
| `accessibility-auditor` | WCAG 2.1/2.2 AA audits using axe-core + Playwright; produces violation reports and automated test files |
| `ci-quality-gatekeeper` | Designs and implements CI quality gates (lint, coverage, E2E, security, a11y) for GitHub Actions and equivalents |

## Conventions

- Skill names: lowercase, hyphenated
- Every skill directory must contain `SKILL.md` with `name` and `description` frontmatter
- Test code follows AAA (Arrange-Act-Assert) pattern
- Integration tests mock all external dependencies — no live services
- Follow the test pyramid: maximize unit, then integration (mocked), minimize E2E

## Provider

Anthropic Claude. Set `ANTHROPIC_API_KEY` before running Pi.

## Running Pi

```bash
npm install -g --ignore-scripts @earendil-works/pi-coding-agent
export ANTHROPIC_API_KEY=your_key
pi
```

Invoke a skill: `/skill:test-architect`, `/skill:api-test-engineer`, etc.
