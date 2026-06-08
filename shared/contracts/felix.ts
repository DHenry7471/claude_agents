// Input/output contract for horus-felix-failure-triage.
// The caller is responsible for pre-fetching the CI report and git diff before invoking the agent.

export interface FelixInput {
  /** Full Vitest JSON report (--reporter=json) OR Playwright JSON report object. */
  ciReport: unknown;
  /**
   * Output of `git diff origin/main...HEAD --name-only` — newline-separated file paths.
   * Pass an empty string if the diff is unavailable.
   */
  gitDiff: string;
  /**
   * Optional map of test name → historical pass rate (0–100).
   * Omit or pass `undefined` if flakiness history is unavailable.
   */
  flakinessHistory?: Record<string, number>;
  /** Branch name for traceability in the output. */
  branch?: string;
  /** CI run identifier for traceability. */
  runId?: string;
}

export type FailureClassification = 'REGRESSION' | 'FLAKY' | 'ENV_NOISE' | 'TEST_BUG' | 'UNKNOWN';
export type Confidence = 'HIGH' | 'MEDIUM' | 'LOW';
export type MergeRecommendation = 'BLOCK' | 'ALLOW';

export interface FelixFailure {
  testName: string;
  filePath: string;
  classification: FailureClassification;
  confidence: Confidence;
  /** One-sentence hypothesis about the root cause. */
  rootCauseHypothesis: string;
  /** Specific line from the stack trace or diff that supports the classification. */
  evidence: string;
  recommendedOwner: string;
  suggestedAction: string;
}

export interface FelixQuarantineStub {
  testName: string;
  /** Ready-to-apply TypeScript `test.skip` stub with a QUARANTINE comment. */
  stub: string;
}

export interface FelixOutput {
  branch: string;
  runId: string;
  totalFailures: number;
  failures: FelixFailure[];
  mergeRecommendation: MergeRecommendation;
  mergeReason: string;
  quarantineStubs: FelixQuarantineStub[];
}
