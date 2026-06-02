export type VerificationKind = "lint" | "typecheck" | "test" | "build" | "smoke" | "custom";

export type ReadinessStatus =
  | "not-runnable"
  | "demo-ready"
  | "beta-ready"
  | "production-blocked"
  | "production-ready";

export type ShipStatus = "blocked" | "manual-review" | "ready";

export type VerificationCommand = {
  kind: VerificationKind;
  command: string;
};

export type CommandResult = VerificationCommand & {
  exitCode: number;
  stdout?: string;
  stderr?: string;
};

export type ProjectInfo = {
  root: string;
  hasPackage: boolean;
  packageManager: "pnpm" | "yarn" | "npm" | "bun" | "unknown";
  frameworks: string[];
  verificationCommands: VerificationCommand[];
};

export type EnvScanResult = {
  documentedKeys: string[];
  availableKeys: string[];
  missingKeys: string[];
  filesRead: string[];
};

export type ReportInput = {
  kind: "audit" | "review" | "ship-check" | "doctor";
  status: string;
  scope: string;
  commands: CommandResult[];
  verifiedFacts: string[];
  inferredRisks: string[];
  blockers: string[];
  nextAction: string;
  knownGaps: string[];
};

export type WrittenReport = {
  markdownPath: string;
  jsonPath: string;
};
