import { getGitDirty, runCommand } from "../core/command-runner.js";
import { loadConfig } from "../core/config.js";
import { detectProject } from "../core/detect-project.js";
import { scanEnv } from "../core/env-scanner.js";
import { classifyShipStatus } from "../core/readiness.js";
import { writeReport } from "../core/report-writer.js";
import { runSmokeChecks } from "../core/smoke-checks.js";
import type { CommandOutcome } from "../core/types.js";

export async function shipCheck(cwd: string): Promise<CommandOutcome> {
  const project = await detectProject(cwd);
  const config = await loadConfig(cwd);
  const env = await scanEnv(cwd);
  const gitDirty = await getGitDirty(cwd);
  const configuredCommands = config.commands.length > 0 ? config.commands : project.verificationCommands;
  const releaseCommands = configuredCommands.filter((command) =>
    ["lint", "typecheck", "test", "build"].includes(command.kind)
  );
  const commandResults = [];
  for (const command of releaseCommands) {
    commandResults.push(await runCommand(command, cwd));
  }
  commandResults.push(...(await runSmokeChecks({ urls: config.smokeUrls, profiles: config.smokeProfiles })));

  const status = classifyShipStatus({ commandResults, missingEnvKeys: env.missingKeys, gitDirty: config.allowDirty ? false : gitDirty });
  const failed = commandResults.filter((result) => result.exitCode !== 0);
  const blockers = [
    ...failed.map((result) => `Command failed: ${result.command}`),
    ...env.missingKeys.map((key) => `Missing documented env key: ${key}`)
  ];
  const report = await writeReport(cwd, {
    kind: "ship-check",
    status,
    scope: `Release check for ${cwd}`,
    commands: commandResults,
    verifiedFacts: [`Git dirty: ${gitDirty ? "yes" : "no"}`, `Release commands run: ${commandResults.length}`],
    inferredRisks: gitDirty && !config.allowDirty ? ["Working tree has uncommitted changes."] : [],
    blockers,
    nextAction: blockers.length > 0 ? "Resolve blockers and rerun ship-check." : "Prepare release notes from the report.",
    knownGaps: ["v0 does not deploy or call production services automatically."]
  });

  return {
    command: "ship-check",
    ok: status !== "blocked",
    status,
    reportPath: report.markdownPath,
    details: { commandsRun: commandResults.length, blockers: blockers.length }
  };
}
