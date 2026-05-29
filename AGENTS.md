# claude_agents

A collection of Claude/Pi-compatible skills for quality engineering workflows.

## Structure

```
skills/
  <skill-name>/
    SKILL.md                  # Required: frontmatter + instructions
    scripts/                  # Helper scripts (optional)
  <skill-name>.skill          # Installable bundle (zip of skill directory)
```

## Skills

- **playwright-qa-agent** — Full-site Playwright UI QA agent. Crawls a site, discovers pages and flows, generates a TypeScript test suite with Page Objects, runs the tests, and outputs a CI config.

## Conventions

- Skill names: lowercase, hyphenated (e.g., `playwright-qa-agent`)
- Every skill directory must contain `SKILL.md` with `name` and `description` frontmatter
- `.skill` files are zip archives of the corresponding skill directory
- Follow the [Agent Skills standard](https://agentskills.io/specification)

## Provider

Anthropic Claude. Set `ANTHROPIC_API_KEY` before running Pi.

## Running Pi

```bash
npm install -g --ignore-scripts @earendil-works/pi-coding-agent
export ANTHROPIC_API_KEY=your_key
pi
```

Invoke a skill directly: `/skill:playwright-qa-agent`
