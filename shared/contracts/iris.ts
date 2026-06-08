// Input/output contract for horus-iris-insight-reporter.
// The caller is responsible for pre-fetching CI run history before invoking the agent.

export interface IrisCiRun {
  runId: string;
  timestamp: string;           // ISO-8601
  branch: string;
  passed: number;
  failed: number;
  skipped: number;
  durationMs: number;
  coverageLines?: number;      // 0–100
  coverageBranches?: number;   // 0–100
  unitCount?: number;
  integrationCount?: number;
  e2eCount?: number;
}

export interface IrisThresholds {
  /** Minimum acceptable pass rate (0–100). Default: 95. */
  minPassRate?: number;
  /** Minimum acceptable line coverage (0–100). Default: 80. */
  minLineCoverage?: number;
  /** Maximum acceptable E2E percentage of total suite (0–100). Default: 20. */
  maxE2ePct?: number;
}

export interface IrisInput {
  runs: IrisCiRun[];
  /** Number of days to analyse. Default: 30. */
  windowDays?: number;
  thresholds?: IrisThresholds;
}

export type Trend = 'IMPROVING' | 'STABLE' | 'DEGRADING';
export type PyramidStatus = 'BALANCED' | 'IMBALANCED' | 'UNKNOWN';
export type AnomalyType =
  | 'SUDDEN_DROP'
  | 'DURATION_SPIKE'
  | 'CONSECUTIVE_FAILURES'
  | 'COVERAGE_DRIFT'
  | 'PYRAMID_IMBALANCE';
export type Severity = 'HIGH' | 'MEDIUM' | 'LOW';

export interface IrisAnomaly {
  type: AnomalyType;
  detail: string;
  severity: Severity;
}

export interface IrisOutput {
  generatedAt: string;   // ISO-8601
  windowDays: number;
  passRate: {
    current: number;
    avg7d: number;
    avg30d: number;
    trend: Trend;
  };
  coverage: {
    lines: number;
    branches: number;
    linesDelta7d: number;
    branchesDelta7d: number;
    trend: Trend;
  };
  pyramid: {
    unitPct: number;
    integrationPct: number;
    e2ePct: number;
    status: PyramidStatus;
  };
  anomalies: IrisAnomaly[];
  /** Most important single insight for this window — one sentence. */
  topInsight: string;
  /** Ordered list of recommended actions. */
  actionItems: string[];
  /** ≤10-line plain-text summary with emoji, ready for Slack or PR comments. */
  slackSummary: string;
  /** Self-contained HTML panel for embedding in the Horus dashboard. */
  htmlSnippet: string;
}
