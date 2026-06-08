// Input/output contract for horus-percy-pr-reviewer.
// The caller is responsible for fetching the PR diff from the GitHub API before invoking the agent.

export interface PercyInput {
  /**
   * Unified diff string — output of `git diff` or the GitHub Compare API
   * (`GET /repos/{owner}/{repo}/compare/{base}...{head}` with `Accept: application/vnd.github.diff`).
   */
  diff: string;
  /** PR URL for traceability in the output. */
  prUrl?: string;
  /** PR title for context. */
  prTitle?: string;
}

export type PercyVerdict = 'APPROVE' | 'REQUEST_CHANGES' | 'COMMENT';

export type PercyStandard =
  | 'AAA_PATTERN'
  | 'GIVEN_WHEN_THEN_NAMING'
  | 'PYRAMID_LAYER_COMPLIANCE'
  | 'MOCK_INJECTION'
  | 'TEST_ISOLATION'
  | 'NO_LOGIC_IN_TESTS'
  | 'NO_HARDCODED_WAITS'
  | 'BEHAVIOR_NOT_IMPLEMENTATION'
  | 'ASSERTION_COMPLETENESS'
  | 'TEST_COUNT_REGRESSION';

export interface PercyComment {
  file: string;
  /** Approximate line number in the new file. 0 if not locatable. */
  line: number;
  standard: PercyStandard;
  /** Constructive explanation of the violation with a correction example. */
  comment: string;
}

export interface PercyOutput {
  prUrl: string;
  prTitle: string;
  overallVerdict: PercyVerdict;
  /** Violations that must be fixed before merge (triggers REQUEST_CHANGES). */
  mustFix: PercyComment[];
  /** Improvements that are optional but raise quality. */
  recommended: PercyComment[];
  /** ≤5-sentence top-level PR comment summarising the review. */
  summary: string;
  /** Which of the 10 standards were evaluated on this diff. */
  standardsChecked: PercyStandard[];
}
