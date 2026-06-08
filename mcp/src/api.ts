import Anthropic from '@anthropic-ai/sdk';
import { lookupAgent, lookupSkill, listAgents, listSkills, listHorusAgents } from './registry.js';
import type { AgentOptions, AgentResult, HorusAgentResult } from './types.js';

const DEFAULT_MAX_TOKENS = 8192;
const DEFAULT_TIMEOUT_MS = 180_000;
const DEFAULT_SKILL_MODEL = 'claude-sonnet-4-6';

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

// ---------------------------------------------------------------------------
// Horus agent runner
// ---------------------------------------------------------------------------

/**
 * Serialise the HorusInput object to a task string and pass it to the agent.
 * Parses the fenced JSON code block from the response and returns it typed as T.
 *
 * @param agentName - Full slug (e.g. "horus-felix-failure-triage") or short alias (e.g. "horus-felix").
 * @param input     - Pre-fetched input object matching the agent's contract (will be JSON.stringify'd).
 * @param options   - Optional model, maxTokens, apiKey, and timeoutMs overrides.
 *
 * @throws If the agent is not a Horus variant, or if the response cannot be parsed as JSON.
 */
export async function runHorusAgent<T = unknown>(
  agentName: string,
  input: unknown,
  options: AgentOptions = {}
): Promise<HorusAgentResult<T>> {
  const apiKey = options.apiKey ?? process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not set.');
  }

  const agent = lookupAgent(agentName);
  if (!agent) {
    const available = listHorusAgents().map(a => a.slug).join(', ');
    throw new Error(`Unknown Horus agent "${agentName}". Available: ${available}`);
  }
  if (!agent.horus) {
    throw new Error(
      `Agent "${agentName}" is not a Horus variant (horus: true). ` +
      `Use runAgent() for standard agents, or use one of: ${listHorusAgents().map(a => a.slug).join(', ')}`
    );
  }

  const model = options.model ?? process.env.CLAUDE_AGENTS_MODEL ?? agent.model;
  const maxTokens = options.maxTokens ?? DEFAULT_MAX_TOKENS;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  const client = new Anthropic({ apiKey, timeout: timeoutMs });

  const task = JSON.stringify(input, null, 2);

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

  const rawOutput = message.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map(b => b.text)
    .join('\n\n');

  // Extract JSON from a fenced code block (```json ... ``` or ``` ... ```)
  const fenceMatch = rawOutput.match(/```(?:json)?\s*\n([\s\S]*?)\n```/);
  const jsonString = fenceMatch ? fenceMatch[1] : rawOutput.trim();

  let data: T;
  try {
    data = JSON.parse(jsonString) as T;
  } catch (err) {
    throw new Error(
      `horus-agent "${agentName}" did not return valid JSON.\n` +
      `Parse error: ${(err as Error).message}\n` +
      `Raw output (first 500 chars): ${rawOutput.slice(0, 500)}`
    );
  }

  const u = message.usage;
  return {
    agent: agentName,
    data,
    rawOutput,
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

/**
 * Run a bundled skill against a task string and return the result.
 *
 * @param skillSlug - Full slug (e.g. "skill-testing-test-architect").
 * @param task      - The task or question to pass to the skill.
 * @param options   - Optional model, maxTokens, apiKey, and timeoutMs overrides.
 */
export async function runSkill(
  skillSlug: string,
  task: string,
  options: AgentOptions = {}
): Promise<AgentResult> {
  const apiKey = options.apiKey ?? process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not set.');
  }

  const skill = lookupSkill(skillSlug);
  if (!skill) {
    const available = listSkills().map(s => s.slug).join(', ');
    throw new Error(`Unknown skill "${skillSlug}". Available: ${available}`);
  }

  const model = options.model ?? process.env.CLAUDE_AGENTS_MODEL ?? DEFAULT_SKILL_MODEL;
  const maxTokens = options.maxTokens ?? DEFAULT_MAX_TOKENS;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  const client = new Anthropic({ apiKey, timeout: timeoutMs });

  const message = await client.messages.create({
    model,
    max_tokens: maxTokens,
    system: [
      {
        type: 'text',
        text: skill.systemPrompt,
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
    agent: skillSlug,
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
