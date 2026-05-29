# claude_agents

A collection of Claude skills and agents built for quality engineering workflows.

## Skills

### playwright-test-writer

Generates a structured Playwright test plan and TypeScript spec files for any URL.

**Outputs two files per run:**
- `[slug].page.ts` — Page Object class with named locators and action methods
- `[slug].spec.ts` — Spec file covering User Flows, Visual, Accessibility, and API suites

**Supports two analysis modes:**
- **Playwright MCP** (preferred) — drives a real browser via accessibility tree for accurate, role-based locators
- **web_fetch** (fallback) — static HTML extraction with `// TODO: verify locator` flags on uncertain selectors

**Install:** Save `skills/playwright-test-writer.skill` via the Claude desktop app.

**Run generated tests:**
```bash
npx playwright test [slug].spec.ts
```

## Structure

```
skills/
  playwright-test-writer/
    SKILL.md                     # Skill prompt
  playwright-test-writer.skill   # Installable skill bundle
```
