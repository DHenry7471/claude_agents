// Input/output contract for horus-greta-coverage-analyst.
// The caller is responsible for pre-fetching the coverage JSON before invoking the agent.

export interface GretaInput {
  /**
   * Istanbul coverage-summary.json object OR V8 JSON coverage report.
   * Pass the parsed JSON — not a file path.
   */
  coverageReport: unknown;
  /**
   * Optional one-sentence descriptions of what each file does.
   * Key = relative file path (e.g. "src/payments/chargeService.ts").
   * Helps the agent make more accurate risk classifications.
   */
  sourceSummaries?: Record<string, string>;
  /**
   * Optional list of path prefixes or substrings that should be treated as
   * high-risk (e.g. ["src/payments", "src/auth"]).
   * Any file whose path contains one of these strings is elevated one risk level.
   */
  highRiskModules?: string[];
}

export type RiskLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type GapType =
  | 'error_path'
  | 'state_transition'
  | 'validation_branch'
  | 'business_logic'
  | 'auth_check'
  | 'other';

export interface CoverageGap {
  filePath: string;
  riskLevel: RiskLevel;
  gapType: GapType;
  /** Human-readable description of what the uncovered code does. */
  description: string;
  /** Line numbers from the coverage report that are uncovered. */
  uncoveredLines: number[];
  /** Branch coverage percentage for this file (0–100). */
  branchCoveragePct: number;
  /** TypeScript Vitest stub that targets this specific gap. */
  testStub: string;
}

export interface GretaOutput {
  overallCoverage: {
    linesPct: number;
    branchesPct: number;
    functionsPct: number;
    statementsPct: number;
  };
  gaps: CoverageGap[];
  /** ≤3-sentence summary suitable for a Slack message or PR comment. */
  summary: string;
  /**
   * File paths sorted by risk × impact (highest first).
   * Use this to decide which gaps to address first.
   */
  investmentOrder: string[];
}
