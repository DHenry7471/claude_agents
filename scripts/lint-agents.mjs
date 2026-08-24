#!/usr/bin/env node
/**
 * lint-agents.mjs
 *
 * Heuristic lint for agents/*.md (including agents/horus/*.md).
 *
 * Every agent file starts with a YAML-ish frontmatter block delimited by
 * `---` lines. This repo's frontmatter is intentionally simple (see
 * CLAUDE.md "Agent file format"), so rather than pull in a YAML dependency
 * we hand-roll a tiny parser that understands exactly the shapes used here:
 *
 *   - simple `key: value` lines
 *   - a `tools: ["A", "B", "C"]` inline array
 *   - a `description: >` folded block (and its indented continuation lines)
 *
 * If a file has no `tools:` key at all, that means "all tools allowed" per
 * this repo's convention (see CLAUDE.md), so we skip the tool-mismatch
 * checks for that file entirely.
 *
 * This script then heuristically flags two classes of mismatch between the
 * declared `tools` array and what the agent's own body instructs it to do:
 *
 *   MISSING_WRITE — the body tells the agent to produce a file on disk
 *                    (phrases like "Write a `", "Write to", "write a file"),
 *                    but neither "Write" nor "Edit" is in `tools`.
 *
 *   MISSING_BASH  — the body has a ```bash fenced block that shells out
 *                    (e.g. invokes `git `), but "Bash" is not in `tools`.
 *
 * This is a lint heuristic, not a full static analyzer — it is intentionally
 * simple and will not catch every phrasing. It exists to catch the class of
 * bug where an agent's own instructions require a tool it wasn't granted.
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const REPO_ROOT = join(__dirname, "..");
const AGENTS_DIR = join(REPO_ROOT, "agents");

const WRITE_PHRASES = [/write a `/i, /write to/i, /write a file/i];

/** Recursively collect every *.md file under `dir`. */
function findMarkdownFiles(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      out.push(...findMarkdownFiles(full));
    } else if (entry.endsWith(".md")) {
      out.push(full);
    }
  }
  return out;
}

/**
 * Split a file's raw text into { frontmatter, body }.
 * Frontmatter is everything between the first pair of `---` lines.
 * Returns frontmatter: null if the file has no frontmatter block.
 */
function splitFrontmatter(raw) {
  const lines = raw.split("\n");
  if (lines[0].trim() !== "---") {
    return { frontmatter: null, body: raw };
  }
  let end = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === "---") {
      end = i;
      break;
    }
  }
  if (end === -1) {
    return { frontmatter: null, body: raw };
  }
  const frontmatter = lines.slice(1, end).join("\n");
  const body = lines.slice(end + 1).join("\n");
  return { frontmatter, body };
}

/**
 * Parse the small subset of YAML this repo's frontmatter actually uses.
 * Returns { hasTools, tools } where hasTools is false when the `tools:`
 * key is absent entirely (meaning "all tools allowed").
 */
function parseFrontmatter(frontmatter) {
  const lines = frontmatter.split("\n");
  let hasTools = false;
  let tools = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(/^tools:\s*\[(.*)\]\s*$/);
    if (match) {
      hasTools = true;
      tools = match[1]
        .split(",")
        .map((s) => s.trim().replace(/^["']|["']$/g, ""))
        .filter(Boolean);
      break;
    }
  }

  return { hasTools, tools };
}

/** Does this body contain a ```bash fenced block that shells out (e.g. `git `)? */
function bodyHasGitInBashBlock(body) {
  const bashBlockRegex = /```bash\n([\s\S]*?)```/g;
  let match;
  while ((match = bashBlockRegex.exec(body)) !== null) {
    const block = match[1];
    if (/\bgit\s/.test(block)) {
      return true;
    }
  }
  return false;
}

function bodyHasWritePhrase(body) {
  return WRITE_PHRASES.some((re) => re.test(body));
}

function lintFile(path) {
  const raw = readFileSync(path, "utf8");
  const { frontmatter, body } = splitFrontmatter(raw);
  const relPath = relative(REPO_ROOT, path);

  if (frontmatter === null) {
    return []; // no frontmatter block — nothing to check
  }

  const { hasTools, tools } = parseFrontmatter(frontmatter);

  if (!hasTools) {
    // No `tools:` key at all => all tools allowed for this agent. Skip.
    return [];
  }

  const flags = [];

  if (bodyHasWritePhrase(body) && !tools.includes("Write") && !tools.includes("Edit")) {
    flags.push({
      path: relPath,
      flag: "MISSING_WRITE",
      reason:
        "body instructs the agent to write a file, but tools does not include Write or Edit",
    });
  }

  if (bodyHasGitInBashBlock(body) && !tools.includes("Bash")) {
    flags.push({
      path: relPath,
      flag: "MISSING_BASH",
      reason:
        "body has a ```bash block invoking shell/git commands, but tools does not include Bash",
    });
  }

  return flags;
}

function main() {
  const files = findMarkdownFiles(AGENTS_DIR);
  const allFlags = files.flatMap(lintFile);

  if (allFlags.length === 0) {
    console.log(`lint-agents: checked ${files.length} file(s) — all agents pass.`);
    process.exit(0);
  }

  console.log(`lint-agents: found ${allFlags.length} issue(s):\n`);
  for (const { path, flag, reason } of allFlags) {
    console.log(`  ${path} [${flag}] ${reason}`);
  }
  console.log("");
  process.exit(1);
}

main();
