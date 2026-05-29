# claude_agents

A collection of Claude/Pi-compatible skills for quality engineering workflows.

## Skills

### playwright-qa-agent

Full-site Playwright UI QA agent. Crawls a site, discovers all significant pages and user flows, generates a complete multi-page TypeScript UI test suite using Page Objects, executes the tests, and outputs a test plan doc, spec files, test run results, and a GitHub Actions CI config.

**Outputs per run:**
- Page Object classes with named locators and action methods
- Spec files covering User Flows, Visual, and Accessibility suites
- GitHub Actions CI config
- Test run results

**Install (Claude desktop):** Save `skills/playwright-qa-agent.skill` via the Claude desktop app.

**Run generated tests:**
```bash
npx playwright test
```

## Pi Integration

This repo supports [Pi coding agent](https://pi.dev) out of the box. Skills are discoverable by Pi via `.pi/settings.json`.

**Setup:**
```bash
npm install -g --ignore-scripts @earendil-works/pi-coding-agent
export ANTHROPIC_API_KEY=your_key
pi
```

**Invoke a skill directly:**
```bash
/skill:playwright-qa-agent
```

## Structure

```
.pi/
  settings.json               # Pi config (provider, model, skill paths)
AGENTS.md                     # Repo context for Pi and other coding agents
skills/
  playwright-qa-agent/
    SKILL.md                  # Skill prompt
    scripts/                  # Helper scripts
  playwright-qa-agent.skill   # Installable skill bundle
```
