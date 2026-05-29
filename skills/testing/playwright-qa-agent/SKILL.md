---
name: playwright-qa-agent
description: >
  Full-site Playwright UI QA agent. Crawls a site, discovers all significant pages and user flows,
  generates a complete multi-page TypeScript UI test suite using Page Objects, executes the tests,
  and outputs a test plan doc, spec files, test run results, and a GitHub Actions CI config.
  Covers User Flows, Visual, and Accessibility — no API testing (use Swagger/dedicated API tools for that).

  Trigger this skill whenever the user wants comprehensive UI QA automation, a full browser test suite,
  "test my whole site", "set up e2e testing", "generate tests for all my pages", "QA automation
  for my app", "playwright CI setup", "write a UI test suite and run it", or any request that implies
  testing more than one page or flow — even casual ones like "can you test my whole app?" or
  "I want automated tests for my site before I ship".

  Also trigger when the user asks to run tests, check results, or set up CI for an existing
  Playwright UI suite.
---

# Playwright QA Agent

You are a Staff SDET operating at site scale. Given a URL, you crawl the site, build a
multi-page UI test strategy, generate a production-ready Playwright project, execute it,
and deliver results plus a CI pipeline config.

**Scope:** UI browser tests only — User Flows, Visual, and Accessibility. API testing is
out of scope; direct the user to Swagger or a dedicated API testing tool for that layer.

This skill delegates single-page analysis to the `playwright-test-writer` skill's approach —
but your job here is the full picture: discovery → plan → implement → run → report.

---

## Phase 1 — Site Discovery

### Step 1: Crawl and map the site

Use the Playwright MCP (`browser_navigate`, `browser_snapshot`) if available; fall back to
`mcp__workspace__web_fetch` for static sites.

Start at the root URL. Discover and categorize pages:

**Navigation crawl** (up to 15 pages — stop at natural boundaries like auth walls):
1. Navigate to root, snapshot, extract all `<nav>` links and primary CTAs
2. Visit each unique path (dedupe by normalized path, skip anchors, external domains, assets)
3. For each page: snapshot → capture title, h1, primary interactions, form actions, API signals
4. Note which pages require auth — include them in the plan but mark `[AUTH REQUIRED]`

**Page categories to look for:**
- Landing / marketing pages
- Auth flows (login, signup, forgot password, OAuth)
- Core app pages (dashboard, list views, detail views)
- Forms and wizards (checkout, onboarding, settings)
- Error pages (404, 500)
- Dynamic UI pages (search results, data tables, infinite scroll)

### Step 2: Identify critical user journeys

From the crawl, extract 3–5 end-to-end flows that matter most. Prioritize:
1. Primary conversion path (signup → onboarding → first value)
2. Core repeat-use flow (login → main task → logout)
3. Error / edge case flows (invalid input, auth failure, empty states)

These become your integration-level tests. Unit-level component tests are out of scope here
(they live in the app's own test suite); focus on user-facing flows.

---

## Phase 2 — Test Strategy and Plan

### Step 3: Produce the Test Plan document

Write `TEST_PLAN.md` covering the full site. Focus entirely on UI browser tests across
three suites: User Flows, Visual, and Accessibility.

```markdown
# QA Test Plan — [Site Name]
**URL:** [root URL]
**Generated:** [date]
**Pages discovered:** [N]
**Analysis method:** Playwright MCP | web_fetch

## Executive Summary
[2–3 sentences: what the site does, what's at risk, UI testing approach]

## Coverage Map

| Page | Slug | User Flows | Visual | Accessibility | Priority |
|------|------|-----------|--------|---------------|----------|
| Home | home | 2 | 1 | 2 | High |
| Login | login | 3 | 1 | 2 | Critical |
| ... | | | | | |

## Critical User Journeys
1. [Journey name]: [page → page → page] — [success criteria]
2. ...

## Out of Scope
- API / REST endpoint testing (use Swagger or a dedicated API tool)
- [e.g., authenticated admin flows, third-party OAuth, payment sandbox]

## Test Files
[List every .spec.ts file that will be generated]

## CI Integration
[Brief note on the GitHub Actions workflow that will be generated]
```

Show the plan to the user and ask: *"Does this coverage look right? Any flows to add or skip
before I generate the tests?"*

---

## Phase 3 — Generate the Test Suite

Once the user approves (or gives adjustments), generate the full project.

### Project structure

```
playwright-tests/
├── playwright.config.ts
├── package.json
├── pages/
│   ├── [slug].page.ts       ← one Page Object per page
│   └── ...
├── tests/
│   ├── [slug].spec.ts       ← one spec per page (UF + VIS + A11Y)
│   └── journeys/
│       └── [journey].spec.ts ← end-to-end journey tests
└── .github/
    └── workflows/
        └── playwright.yml
```

### Step 4: Write Page Objects (`pages/[slug].page.ts`)

Follow the same Page Object rules as `playwright-test-writer`:
- One class per page
- All locators as named properties; prefer `getByRole` > `getByLabel` > `getByText` > CSS
- Action methods represent complete user gestures (fill + submit = one method)
- No `expect()` calls inside Page Objects

### Step 5: Write spec files (`tests/[slug].spec.ts`)

For each page, generate three UI test suites:
- **User Flows** (`[SLUG]-UF-01`, `UF-02`, …) — interactions that matter: form submissions, navigation, state changes, error messages
- **Visual** (`[SLUG]-VIS-01`, …) — key elements are visible and rendered correctly
- **Accessibility** (`[SLUG]-A11Y-01`, …) — ARIA landmarks, alt text, label associations, keyboard focus

No API tests. If an interaction triggers a network request, assert the resulting UI state
(e.g., success message shown, new item in list) — not the HTTP call itself.

Use the slug prefix system to keep IDs unique across the full suite.

### Step 6: Write journey tests (`tests/journeys/[journey].spec.ts`)

Each critical user journey gets its own spec. These tests span multiple Page Objects:

```typescript
import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/login.page';
import { DashboardPage } from '../pages/dashboard.page';

test.describe('Journey: Login to Dashboard', () => {
  test('user logs in and sees their dashboard', async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.signIn({ email: 'test@example.com', password: 'password123' });

    const dashboard = new DashboardPage(page);
    await expect(dashboard.heading).toBeVisible();
  });
});
```

Use `test.use({ storageState: 'auth.json' })` for tests that need pre-authenticated state.

### Step 7: Write `playwright.config.ts`

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html'], ['github']],
  use: {
    baseURL: process.env.BASE_URL || '[root URL]',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox',  use: { ...devices['Desktop Firefox'] } },
  ],
});
```

### Step 8: Write GitHub Actions CI (`.github/workflows/playwright.yml`)

```yaml
name: Playwright Tests
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    timeout-minutes: 30
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: lts/*
      - name: Install dependencies
        run: npm ci
        working-directory: playwright-tests
      - name: Install Playwright browsers
        run: npx playwright install --with-deps
        working-directory: playwright-tests
      - name: Run Playwright tests
        run: npx playwright test
        working-directory: playwright-tests
        env:
          BASE_URL: ${{ secrets.BASE_URL || '[root URL]' }}
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: playwright-tests/playwright-report/
          retention-days: 30
```

---

## Phase 4 — Execute and Report

### Step 9: Run the tests

Install and run using the Playwright MCP's `browser_run_code_unsafe` or via bash:

```bash
cd playwright-tests && npm install && npx playwright install chromium && npx playwright test --reporter=list
```

Capture stdout/stderr. Parse the summary line (e.g., `12 passed, 2 failed`).

### Step 10: Write `TEST_RESULTS.md`

```markdown
# Test Results — [Site Name]
**Run date:** [date]
**Duration:** [Xs]

## Summary
| Suite | Passed | Failed | Skipped |
|-------|--------|--------|---------|
| User Flows | N | N | N |
| Visual | N | N | N |
| Accessibility | N | N | N |
| Journeys | N | N | N |
| **Total** | **N** | **N** | **N** |

## Failures
### [test name]
**File:** tests/[slug].spec.ts  
**Error:** [error message]  
**Likely cause:** [your diagnosis — broken selector, timing, env issue, etc.]  
**Fix:** [specific recommendation]

## Flaky / Skipped
[List any retried tests or tests skipped due to auth]

## Next Steps
[Top 3 action items based on results]
```

---

## Output

Save all files to the outputs folder:

```
playwright-tests/           ← full runnable project
TEST_PLAN.md
TEST_RESULTS.md
```

Present all deliverables with `mcp__cowork__present_files`. Then give the user a one-line
run command:

```
cd playwright-tests && npm install && npx playwright install && npx playwright test
```

---

## Quality principles (always apply)

- **UI only**: Every test drives a real browser. API contract testing belongs in Swagger or a
  dedicated API tool — don't use `apiRequest` here.
- **No flaky selectors**: Prefer semantic locators (`getByRole`, `getByLabel`) over CSS/XPath.
  If you must use CSS, add a `// TODO: add data-testid` comment.
- **One assertion per test**: Each test checks one thing. A test named "login flow" should not
  also check footer links.
- **Assert UI outcomes**: When a form submission triggers a backend call, assert the resulting
  UI state (success banner, redirect, new item visible) — not the network response.
- **Meaningful IDs**: Test IDs like `[SLUG]-UF-01` enable filtering and tracking in CI dashboards.
- **Auth state**: If the site has auth, generate a `global-setup.ts` that authenticates once
  and saves `auth.json` — don't repeat the login flow in every test.
