import { BUNDLED_AGENTS, BUNDLED_SKILLS } from './generated/prompts.js';
import type { AgentDef, SkillDef } from './types.js';

/** Short aliases used in Horus npm scripts (e.g. "felix" → "felix-failure-triage"). */
export const SLUG_ALIASES: Readonly<Record<string, string>> = {
  felix: 'felix-failure-triage',
  greta: 'greta-coverage-analyst',
  iris: 'iris-insight-reporter',
  percy: 'percy-pr-reviewer',
  saxon: 'saxon-spec-to-test',
  tessa: 'tessa-test-strategist',
  clint: 'clint-ci-gatekeeper',
  ambrosine: 'ambrosine-api-tester',
  ernie: 'ernie-e2e-test-writer',
  pat: 'pat-pact-contract-tester',
  furio: 'furio-forge-test-data',
  kurt: 'kurt-striker-mutation-analyst',
};

const agentMap = new Map<string, AgentDef>(
  BUNDLED_AGENTS.map(a => [a.slug, a])
);

const skillMap = new Map<string, SkillDef>(
  BUNDLED_SKILLS.map(s => [s.slug, s])
);

export function lookupAgent(nameOrSlug: string): AgentDef | undefined {
  return agentMap.get(SLUG_ALIASES[nameOrSlug] ?? nameOrSlug);
}

export function lookupSkill(slug: string): SkillDef | undefined {
  return skillMap.get(slug);
}

export function listAgents(): AgentDef[] {
  return BUNDLED_AGENTS;
}

export function listSkills(): SkillDef[] {
  return BUNDLED_SKILLS;
}
