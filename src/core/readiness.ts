import type { CommandResult, ReadinessStatus, ShipStatus } from "./types.js";

export type ReadinessInput = {
  hasPackage: boolean;
  commandResults: CommandResult[];
  missingEnvKeys: string[];
  gitDirty: boolean;
};

export function classifyReadiness(input: ReadinessInput): ReadinessStatus {
  if (!input.hasPackage && input.commandResults.length === 0) return "not-runnable";
  if (input.commandResults.some((result) => result.exitCode !== 0)) return "production-blocked";
  if (input.missingEnvKeys.length > 0) return "production-blocked";
  if (input.commandResults.length === 0) return "demo-ready";
  if (input.gitDirty) return "beta-ready";
  const hasBuild = input.commandResults.some((result) => result.kind === "build" && result.exitCode === 0);
  const hasQualityGate = input.commandResults.some((result) =>
    ["test", "lint", "typecheck"].includes(result.kind)
  );
  return hasBuild && hasQualityGate ? "production-ready" : "beta-ready";
}

export type ShipInput = {
  commandResults: CommandResult[];
  missingEnvKeys: string[];
  gitDirty: boolean;
};

export function classifyShipStatus(input: ShipInput): ShipStatus {
  if (input.commandResults.some((result) => result.exitCode !== 0)) return "blocked";
  if (input.missingEnvKeys.length > 0) return "blocked";
  if (input.gitDirty) return "manual-review";
  const hasBuild = input.commandResults.some((result) => result.kind === "build" && result.exitCode === 0);
  return hasBuild ? "ready" : "manual-review";
}
