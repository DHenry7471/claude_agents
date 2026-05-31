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
}

export interface AgentResult {
  agent: string;
  output: string;
}
