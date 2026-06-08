export interface AgentDef {
  slug: string;
  name: string;
  description: string;
  model: string;
  systemPrompt: string;
  /**
   * True for Horus API variants (agents/horus/).
   * These agents expect all context pre-packed in the task string and always
   * return a single JSON code block. Use runHorusAgent() to call them.
   */
  horus?: boolean;
}

export interface SkillDef {
  slug: string;
  name: string;
  description: string;
  systemPrompt: string;
}

export interface AgentOptions {
  /** Override the model. Falls back to CLAUDE_AGENTS_MODEL env var, then the agent's default. */
  model?: string;
  /** Max tokens for the response (default: 8192). */
  maxTokens?: number;
  /** Override ANTHROPIC_API_KEY for this call. */
  apiKey?: string;
  /** Request timeout in milliseconds (default: 180_000). */
  timeoutMs?: number;
}

export interface AgentUsage {
  inputTokens: number;
  outputTokens: number;
  /** Tokens served from the prompt cache (billed at ~10% of normal input rate). */
  cacheReadTokens: number;
  /** Tokens written into the prompt cache on this call. */
  cacheCreationTokens: number;
}

export interface AgentResult {
  agent: string;
  output: string;
  model: string;
  stopReason: string;
  usage: AgentUsage;
}

/**
 * Result from runHorusAgent(). The `data` field is the parsed JSON object
 * extracted from the agent's fenced code block response.
 * `rawOutput` is the full text in case you need to debug a parse failure.
 */
export interface HorusAgentResult<T = unknown> {
  agent: string;
  data: T;
  rawOutput: string;
  model: string;
  stopReason: string;
  usage: AgentUsage;
}
