# claude_agents

A collection of Claude/Pi-compatible skills for quality engineering workflows. Focused on SDET
tooling — test strategy, API testing, UI automation, accessibility, and CI quality gates.

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
