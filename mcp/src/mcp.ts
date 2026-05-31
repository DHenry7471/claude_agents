#!/usr/bin/env node
/**
 * MCP server entry point.
 * Exposes every bundled agent and skill as a callable MCP tool.
 *
 * Environment variables:
 *   ANTHROPIC_API_KEY  — required
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { listAgents, listSkills } from './registry.js';

const apiKey = process.env.ANTHROPIC_API_KEY;
if (!apiKey) {
  console.error('ERROR: ANTHROPIC_API_KEY environment variable is not set.');
  process.exit(1);
}

const anthropic = new Anthropic({ apiKey });

// ---------------------------------------------------------------------------
// Shared input schema
// ---------------------------------------------------------------------------

const TaskInput = z.object({
  task: z.string().describe(
    'The task or question for the agent/skill. Include file paths, repo context, or relevant code snippets.'
  ),
  model: z.string().optional().describe('Model override (e.g. claude-opus-4-8).'),
  max_tokens: z.number().int().positive().optional().describe('Max tokens (default: 8192).'),
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
    messages: [{ role: 'user', content: task }],
  });

  return message.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map(b => b.text)
    .join('\n\n');
}

// ---------------------------------------------------------------------------
// Build & start server
// ---------------------------------------------------------------------------

const agents = listAgents();
const skills = listSkills();

console.error(`claude-agents-mcp: ${agents.length} agents, ${skills.length} skills`);

const server = new McpServer({ name: 'claude-agents-mcp', version: '1.0.0' });

for (const agent of agents) {
  server.tool(
    agent.slug,
    `[Agent] ${agent.description}`,
    TaskInput.shape,
    async ({ task, model, max_tokens }) => {
      try {
        const text = await runWithSystemPrompt(
          agent.systemPrompt,
          task,
          model ?? agent.model,
          max_tokens ?? 8192
        );
        return { content: [{ type: 'text', text }] };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return { content: [{ type: 'text', text: `Error: ${message}` }], isError: true };
      }
    }
  );
}

for (const skill of skills) {
  server.tool(
    skill.slug,
    `[Skill] ${skill.description}`,
    TaskInput.shape,
    async ({ task, model, max_tokens }) => {
      try {
        const text = await runWithSystemPrompt(
          skill.systemPrompt,
          task,
          model ?? 'claude-sonnet-4-6',
          max_tokens ?? 8192
        );
        return { content: [{ type: 'text', text }] };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return { content: [{ type: 'text', text: `Error: ${message}` }], isError: true };
      }
    }
  );
}

server.tool(
  'list-agents-and-skills',
  'Returns all registered agents and skills with their descriptions.',
  {},
  async () => {
    const rows = [
      '## Agents\n',
      ...agents.map(a => `**${a.slug}** (model: ${a.model})\n${a.description}`),
      '\n## Skills\n',
      ...skills.map(s => `**${s.slug}**\n${s.description}`),
    ];
    return { content: [{ type: 'text', text: rows.join('\n\n') }] };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
