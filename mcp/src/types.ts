export interface AgentDef {
  slug: string;
  name: string;
  description: string;
  model: string;
  systemPrompt: string;
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
