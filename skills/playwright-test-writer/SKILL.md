---
name: playwright-test-writer
description: >
  Generates a structured Playwright test plan and complete TypeScript spec file for any URL.
  Use this skill whenever the user provides a URL and wants Playwright tests, a test plan,
  e2e tests, browser tests, or QA automation. Trigger on phrases like "write tests for",
  "generate Playwright tests", "create a test suite", "test this page", "QA this URL",
  or any time a URL is given alongside a testing intent — even casual ones like "can you
  test my site?" or "write some tests for this".
---

# Playwright Test Writer

You are an expert Playwright test engineer. When given a URL, you run a **two-phase workflow**: first produce a structured test plan, then implement it as a Page Object + spec file.

## Phase 1 — Build the Test Plan

### Step 1: Fetch and analyse the page

**Check whether the Playwright MCP is available** by looking for `browser_navigate` in your tool list. Use whichever path applies:

---

#### Path A — Playwright MCP available (preferred)

The Playwright MCP drives a real browser, so it sees JavaScript-rendered content, dynamic elements, and live network requests — far richer than static HTML.

1. `browser_navigate` to the URL
2. `browser_snapshot` to get the full accessibility tree (roles, labels, states, hierarchy)
3. For pages with meaningful interactions (forms, modals, tabs), use `browser_click` / `browser_type` / `browser_select_option` to trigger dynamic content, then `browser_snapshot` again to capture the updated state
4. `browser_take_screenshot` once to capture the visual layout for the Visual suite

Extract from the accessibility tree and screenshot:
- **Forms**: input roles, labels, placeholder text, required state, associated buttons
- **Buttons**: accessible name, role, disabled state
- **Navigation**: landmark roles (`navigation`, `main`, `banner`, `contentinfo`), link names
- **Headings**: level and text content
- **Images**: alt text (or flag missing alt)
- **Dynamic elements**: modals, dropdowns, toasts — note trigger + content
- **Network signals**: any API calls observed in the accessibility tree structure or noted in inline scripts visible via snapshot

---

#### Path B — Playwright MCP not available (fallback)

Use `mcp__workspace__web_fetch` to fetch the URL's raw HTML. Extract the following:

**Interactive elements**
- Forms: action URL, method, field names, types, labels, required status
- Buttons: text, type attribute
- Links: visible text, href

**Content**
- Page title and `<h1>`–`<h3>` headings
- Images: src, alt text
- ARIA landmarks and `role` attributes

**API signals** — scan heuristically:
- Form `action` attributes → server endpoints
- Inline `<script>` tags with `fetch(`, `axios.`, or `XMLHttpRequest` calls
- `<a href>` values matching `/api/`, `/v1/`, `/graphql`, `/rest/`, `/rpc/`
- `<link rel="preload" as="fetch">` hints
- `data-*` attributes containing URL-like strings

If the page is client-rendered (returns a shell with no real content), note it in the plan and base tests on what can be inferred from URL structure and any static content.

---

### Step 2: Derive a page slug

Before writing the plan, derive a short **page slug** from the URL. This slug prefixes every test ID so tests remain unique across a multi-page test suite — essential when tests from many pages end up in the same project.

Rules for the slug:
- Take the meaningful path segment(s) of the URL, lowercased, hyphens only
- Strip generic words like `www`, `index`, `home`, `docs`
- Max 3 segments joined by hyphens
- Examples: `github.com/login` → `gh-login`, `playwright.dev/docs/intro` → `pw-docs-intro`, `jsonplaceholder.typicode.com` → `jsonph`

Use this slug as the prefix for all test IDs: `[SLUG]-UF-01`, `[SLUG]-VIS-01`, `[SLUG]-A11Y-01`, `[SLUG]-API-01`.

### Step 3: Write the test plan

Output a clearly labelled **TEST PLAN** section (not a file — just in the chat) using this structure:

```
## Test Plan — [Page Title] ([URL])
**Slug:** [SLUG]
**Analysis method:** Playwright MCP (live browser) | web_fetch (static HTML)
**Summary:** [1–2 sentences on what the page does]

### User Flows
*[Why these tests matter for this page]*
- [SLUG]-UF-01: [Title] — [steps] → assert [what]
- [SLUG]-UF-02: ...

### Visual
*[Rationale]*
- [SLUG]-VIS-01: [Title] — assert [heading/image/section] is visible

### Accessibility
*[Rationale]*
- [SLUG]-A11Y-01: [Title] — assert [ARIA landmark / alt text / label]

### API
*[Which endpoints were found, or "no API endpoints detected — smoke test only"]*
- [SLUG]-API-01: [METHOD] [endpoint] — assert [status / body shape / auth behavior]
- [SLUG]-API-02: [error path] — assert [4xx response]
```

Be specific — reference actual element text, field names, and URLs found on the page. If no API endpoints are detected, still include one smoke test: `GET [url]` returns 200 with the expected `Content-Type`.

Pause here and show the plan to the user. Ask: *"Does this plan look right? Any tests to add, remove, or adjust before I write the code?"*

---

## Phase 2 — Write the Page Object and Spec

Once the user approves the plan (or gives feedback), produce **two files**: a Page Object class and a spec file that uses it.

The reason to split them is maintainability: when a selector changes on the real page, you fix it in one place (the Page Object) rather than hunting through every test. Tests read like plain English; the Page Object handles all the "how".

---

### File 1: `[slug].page.ts` — the Page Object

The Page Object encapsulates every locator and action the spec needs. No `expect` calls here — just navigation, element access, and interactions.

```typescript
import { type Page, type Locator } from '@playwright/test';

export class [SlugPascalCase]Page {
  readonly page: Page;
  readonly url = '[the URL]';

  // ── Locators ────────────────────────────────────────────────────────────────
  // Group by section: header, form, nav, content, footer, etc.
  readonly heading: Locator;
  readonly [fieldName]Input: Locator;
  readonly submitButton: Locator;
  // ... one property per interactive or asserted element

  constructor(page: Page) {
    this.page = page;
    // Prefer getByRole / getByLabel / getByText over CSS selectors
    this.heading        = page.getByRole('heading', { level: 1 });
    this.[fieldName]Input = page.getByLabel('[label text]');
    this.submitButton   = page.getByRole('button', { name: '[button text]' });
  }

  // ── Actions ─────────────────────────────────────────────────────────────────
  async goto() {
    await this.page.goto(this.url);
  }

  async fill[FormName](data: { [field]: string; [field2]: string }) {
    await this.[field]Input.fill(data.[field]);
    await this.[field2]Input.fill(data.[field2]);
    await this.submitButton.click();
  }

  // One method per meaningful user action on this page
}
```

Rules for Page Objects:
- Every locator used in the spec must be a named property on the class — no raw selectors in the spec file
- Action methods should represent a complete user gesture (fill + submit = one method), not individual keystrokes
- Locator priority: `getByRole` → `getByLabel` → `getByText` → `getByPlaceholder` → `locator('[data-testid]')` → CSS as last resort
- Never put assertions (`expect`) inside the Page Object

**If you used the Playwright MCP in Phase 1**, the accessibility tree gives you exact ARIA roles, accessible names, and element states — use these directly as `getByRole` / `getByLabel` arguments. This produces more reliable locators than inferring them from raw HTML. For example, if the snapshot shows `[ref=e45] textbox "Email address"`, use `page.getByRole('textbox', { name: 'Email address' })` rather than a CSS selector.

**If you used web_fetch**, derive locators from the extracted field names, labels, and button text as best you can. Flag any locators that may need adjustment once run against the real browser with a `// TODO: verify locator` comment.

---

### File 2: `[slug].spec.ts` — the spec

Import the Page Object and use it throughout. The spec should read like a description of what the user does and sees, not how Playwright finds elements.

```typescript
import { test, expect } from '@playwright/test';
import { [SlugPascalCase]Page } from './[slug].page';

// ─── User Flows ───────────────────────────────────────────────────────────────
test.describe('User Flows', () => {
  let po: [SlugPascalCase]Page;

  test.beforeEach(async ({ page }) => {
    po = new [SlugPascalCase]Page(page);
    await po.goto();
  });

  // [SLUG]-UF-01
  test('[title from plan]', async ({ page }) => {
    await po.fill[FormName]({ [field]: 'value', [field2]: 'value' });
    await expect(page).toHaveURL(/expected-path/);
  });
});

// ─── Visual ───────────────────────────────────────────────────────────────────
test.describe('Visual', () => {
  let po: [SlugPascalCase]Page;

  test.beforeEach(async ({ page }) => {
    po = new [SlugPascalCase]Page(page);
    await po.goto();
  });

  // [SLUG]-VIS-01
  test('page heading is visible', async () => {
    await expect(po.heading).toBeVisible();
  });
});

// ─── Accessibility ────────────────────────────────────────────────────────────
test.describe('Accessibility', () => {
  let po: [SlugPascalCase]Page;

  test.beforeEach(async ({ page }) => {
    po = new [SlugPascalCase]Page(page);
    await po.goto();
  });

  // [SLUG]-A11Y-01: images have alt text
  test('all images have alt text', async ({ page }) => {
    const images = page.locator('img');
    const count = await images.count();
    for (let i = 0; i < count; i++) {
      await expect(images.nth(i)).toHaveAttribute('alt', /.+/);
    }
  });

  // [SLUG]-A11Y-02: ARIA landmarks present
  test('main and navigation landmarks exist', async ({ page }) => {
    await expect(page.getByRole('main')).toBeVisible();
    await expect(page.getByRole('navigation')).toBeVisible();
  });
});

// ─── API ──────────────────────────────────────────────────────────────────────
test.describe('API', () => {
  // API tests use Playwright's built-in request context — no extra libraries needed
  let apiRequest: import('@playwright/test').APIRequestContext;

  test.beforeAll(async ({ playwright }) => {
    apiRequest = await playwright.request.newContext({
      baseURL: '[origin]',
      extraHTTPHeaders: { Accept: 'application/json' },
    });
  });

  test.afterAll(async () => {
    await apiRequest.dispose();
  });

  // [SLUG]-API-01
  test('[title]', async () => {
    const response = await apiRequest.get('/path');
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('application/json');
  });

  // [SLUG]-API-02 — error path
  test('[title] returns 4xx for invalid input', async () => {
    const response = await apiRequest.post('/path', { data: {} });
    expect(response.status()).toBeGreaterThanOrEqual(400);
  });
});
```

### Additional API patterns
- **Body shape**: `const body = await response.json(); expect(body).toHaveProperty('key');`
- **Response time**: `const t = Date.now(); await apiRequest.get(...); expect(Date.now() - t).toBeLessThan(2000);`
- **Auth-required**: assert 401 or 403 when no token is provided
- **POST/PUT**: pass `{ data: { ... } }` for JSON bodies

---

### Output

Save both files to the outputs folder and present them together with `mcp__cowork__present_files`:
- `[slug].page.ts`
- `[slug].spec.ts`

Then tell the user:
```
Run with: npx playwright test [slug].spec.ts
```
