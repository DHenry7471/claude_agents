#!/usr/bin/env node
/**
 * claude-agents-mcp
 *
 * An MCP server that exposes every agent and skill in the claude_agents repo
 * as a callable tool. Each tool invocation runs the agent/skill via the
 * Anthropic API (Option B — full execution) and streams the result back.
 *
 * Environment variables:
 *   ANTHROPIC_API_KEY   — required
 *   AGENTS_DIR          — path to the agents/ directory  (default: ../agents)
 *   SKILLS_DIR          — path to the skills/ directory  (default: ../skills)
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { loadAgents, loadSkills } from "./loader.js";

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "../../");

const AGENTS_DIR = process.env.AGENTS_DIR ?? resolve(repoRoot, "agents");
const SKILLS_DIR = process.env.SKILLS_DIR ?? resolve(repoRoot, "skills");

// ---------------------------------------------------------------------------
// Anthropic client
// ---------------------------------------------------------------------------

const apiKey = process.env.ANTHROPIC_API_KEY;
if (!apiKey) {
  console.error("ERROR: ANTHROPIC_API_KEY environment variable is not set.");
  process.exit(1);
}

const anthropic = new Anthropic({ apiKey });

// ---------------------------------------------------------------------------
// Shared tool input schema
// ---------------------------------------------------------------------------

const TaskInput = z.object({
  task: z
    .string()
    .describe(
      "The task or question for the agent/skill to execute. Be as specific as possible — include file paths, repo context, or relevant code snippets."
    ),
  model: z
    .string()
    .optional()
    .describe(
      "Optional model override (e.g. claude-opus-4-6). Defaults to the agent's configured model."
    ),
  max_tokens: z
    .number()
    .int()
    .positive()
    .optional()
    .describe("Max tokens for the response (default: 8192)."),
});

// ---------------------------------------------------------------------------
// Execution helper
// ---------------------------------------------------------------------------

async function runWithSystemPrompt(
  systemPrompt: string,
  task: string,
  model: string,
  maxTokens: number
): Promise<string> {
  const message = await anthropic.messages.create({
    model,
    max_tokens: maxTokens,
    system: systemPrompt,
    messages: [{ role: "user", content: task }],
  });

  // Extract text content from the response
  const parts = message.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text);

  return parts.join("\n\n");
}

// ---------------------------------------------------------------------------
// Build & register MCP server
// ---------------------------------------------------------------------------

async function main() {
  // Load agents and skills at startup
  const agents = loadAgents(AGENTS_DIR);
  const skills = loadSkills(SKILLS_DIR);

  console.error(
    `Loaded ${agents.length} agents, ${skills.length} skills from ${repoRoot}`
  );

  const server = new McpServer({
    name: "claude-agents-mcp",
    version: "1.0.0",
  });

  // -------------------------------------------------------------------------
  // Register one tool per agent
  // -------------------------------------------------------------------------

  for (const agent of agents) {
    const defaultModel = agent.model;

    server.tool(
      agent.slug,
      // Description shown to the LLM choosing which tool to call
      `[Agent] ${agent.description}`,
      TaskInput.shape,
      async ({ task, model, max_tokens }) => {
        const resolvedModel = model ?? defaultModel;
        const resolvedMaxTokens = max_tokens ?? 8192;

        try {
          const result = await runWithSystemPrompt(
            agent.systemPrompt,
            task,
            resolvedModel,
            resolvedMaxTokens
          );

          return {
            content: [{ type: "text", text: result }],
          };
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          return {
            content: [
              {
                type: "text",
                text: `Error running agent "${agent.slug}": ${message}`,
              },
            ],
            isError: true,
          };
        }
      }
    );
  }

  // -------------------------------------------------------------------------
  // Register one tool per skill
  // -------------------------------------------------------------------------

  for (const skill of skills) {
    server.tool(
      skill.slug,
      `[Skill] ${skill.description}`,
      TaskInput.shape,
      async ({ task, model, max_tokens }) => {
        const resolvedModel = model ?? "claude-sonnet-4-6";
        const resolvedMaxTokens = max_tokens ?? 8192;

        try {
          const result = await runWithSystemPrompt(
            skill.systemPrompt,
            task,
            resolvedModel,
            resolvedMaxTokens
          );

          return {
            content: [{ type: "text", text: result }],
          };
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          return {
            content: [
              {
                type: "text",
                text: `Error running skill "${skill.slug}": ${message}`,
              },
            ],
            isError: true,
          };
        }
      }
    );
  }

  // -------------------------------------------------------------------------
  // List-agents utility tool (introspection)
  // -------------------------------------------------------------------------

  server.tool(
    "list-agents-and-skills",
    "Returns a table of all registered agents and skills with their descriptions.",
    {},
    async () => {
      const rows: string[] = [
        "## Agents\n",
        ...agents.map((a) => `**${a.slug}** (model: ${a.model})\n${a.description}`),
        "\n## Skills\n",
        ...skills.map((s) => `**${s.slug}**\n${s.description}`),
      ];
      return { content: [{ type: "text", text: rows.join("\n\n") }] };
    }
  );

  // -------------------------------------------------------------------------
  // Start transport
  // -------------------------------------------------------------------------

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("claude-agents-mcp running on stdio");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
