import Anthropic from '@anthropic-ai/sdk';
import { lookupAgent, listAgents } from './registry.js';
import type { AgentOptions, AgentResult } from './types.js';

const DEFAULT_MAX_TOKENS = 8192;
const DEFAULT_TIMEOUT_MS = 180_000;

/**
 * Run a bundled agent against a task string and return the result.
 *
 * @param agentName - Full slug (e.g. "felix-failure-triage") or short alias (e.g. "felix").
 * @param task      - The task or question to pass to the agent.
 * @param options   - Optional model, maxTokens, apiKey, and timeoutMs overrides.
 */
export async function runAgent(
  agentName: string,
  task: string,
  options: AgentOptions = {}
): Promise<AgentResult> {
  const apiKey = options.apiKey ?? process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not set.');
  }

  const agent = lookupAgent(agentName);
  if (!agent) {
    const available = listAgents().map(a => a.slug).join(', ');
    throw new Error(`Unknown agent "${agentName}". Available: ${available}`);
  }

  const model = options.model ?? process.env.CLAUDE_AGENTS_MODEL ?? agent.model;
  const maxTokens = options.maxTokens ?? DEFAULT_MAX_TOKENS;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  const client = new Anthropic({ apiKey, timeout: timeoutMs });

  const message = await client.messages.create({
    model,
    max_tokens: maxTokens,
    system: [
      {
        type: 'text',
        text: agent.systemPrompt,
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [{ role: 'user', content: task }],
  });

  const output = message.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map(b => b.text)
    .join('\n\n');

  const u = message.usage;
  return {
    agent: agentName,
    output,
    model,
    stopReason: message.stop_reason ?? 'unknown',
    usage: {
      inputTokens: u.input_tokens,
      outputTokens: u.output_tokens,
      cacheReadTokens: u.cache_read_input_tokens ?? 0,
      cacheCreationTokens: u.cache_creation_input_tokens ?? 0,
    },
  };
}
