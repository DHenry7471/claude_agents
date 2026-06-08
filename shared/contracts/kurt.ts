// Input/output contract for horus-kurt-striker-mutation-analyst.
// The caller is responsible for pre-fetching mutation.json before invoking the agent.

export interface StrykerMutantLocation {
  start: { line: number; column: number };
  end:   { line: number; column: number };
}

export type StrykerMutantStatus =
  | 'Survived'
  | 'Killed'
  | 'NoCoverage'
  | 'Ignored'
  | 'Timeout'
  | 'CompileError';

export interface StrykerMutant {
  id: string;
  mutatorName: string;
  replacement: string;
  location: StrykerMutantLocation;
  status: StrykerMutantStatus;
  statusReason?: string;
  coveredBy?: string[];
  killedBy?: string[];
  static?: boolean;
}

export interface StrykerFileReport {
  language: string;
  mutants: StrykerMutant[];
  /** Full source file content — used by the agent to understand mutation context. */
  source: string;
}

export interface StrykerReport {
  schemaVersion: string;
  thresholds: { high: number; low: number; break?: number };
  projectRoot: string;
  files: Record<string, StrykerFileReport>;
}

export interface KurtInput {
  strykerReport: StrykerReport;
  /**
   * Optional path prefixes/substrings treated as high-risk.
   * Files matching any entry are elevated one risk level.
   */
  highRiskModules?: string[];
}

export type KurtRiskLevel = 'CRITICAL' | 'HIGH' | 'LOW';

export interface KurtKill {
  mutantId: string;
  filePath: string;
  line: number;
  mutatorName: string;
  /** What Stryker replaced the original code with. */
  replacement: string;
  riskLevel: KurtRiskLevel;
  /** Why this surviving mutant is dangerous. */
  rationale: string;
  /** TypeScript Vitest stub that would kill this specific mutant. */
  testStub: string;
}

export interface KurtAcceptableSurvivor {
  mutantId: string;
  filePath: string;
  line: number;
  mutatorName: string;
  /** Why it is safe to leave this mutant alive. */
  rationale: string;
}

export interface KurtOutput {
  /** Mutation score from the report (0–100). */
  mutationScore: number;
  /** Estimated score if all CRITICAL + HIGH kills are applied. */
  projectedScoreAfterKills: number;
  totalSurvivors: number;
  kills: KurtKill[];
  acceptableSurvivors: KurtAcceptableSurvivor[];
  /** ≤3-sentence summary for Slack or PR comment. */
  summary: string;
}
