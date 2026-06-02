import { getGitDirty, runCommand } from "../core/command-runner.js";
import { loadConfig } from "../core/config.js";
import { detectProject } from "../core/detect-project.js";
import { scanEnv } from "../core/env-scanner.js";
import { classifyReadiness } from "../core/readiness.js";
import { writeReport } from "../core/report-writer.js";
import { runSmokeChecks } from "../core/smoke-checks.js";
import type { CommandOutcome } from "../core/types.js";

export async function audit(cwd: string): Promise<CommandOutcome> {
  const project = await detectProject(cwd);
  const config = await loadConfig(cwd);
  const env = await scanEnv(cwd);
  const gitDirty = await getGitDirty(cwd);
  const commandResults = [];
  const verificationCommands = config.commands.length > 0 ? config.commands : project.verificationCommands;
  for (const command of verificationCommands) {
    commandResults.push(await runCommand(command, cwd));
  }
  commandResults.push(...(await runSmokeChecks(config.smokeUrls)));

  const status = classifyReadiness({
    hasPackage: project.hasPackage,
    commandResults,
    missingEnvKeys: env.missingKeys,
    gitDirty
  });
  const failed = commandResults.filter((result) => result.exitCode !== 0);
  const report = await writeReport(cwd, {
    kind: "audit",
    status,
    scope: `${project.packageManager} project at ${cwd}`,
    commands: commandResults,
    verifiedFacts: [
      project.hasPackage ? "package.json found" : "package.json not found",
      `Framework signals: ${project.frameworks.length > 0 ? project.frameworks.join(", ") : "none"}`,
      `Documented env keys: ${env.documentedKeys.length}`,
      `Git dirty: ${gitDirty ? "yes" : "no"}`
    ],
    inferredRisks: env.missingKeys.map((key) => `Documented env key is not available locally: ${key}`),
    blockers: failed.map((result) => `Command failed: ${result.command}`),
    nextAction: failed.length > 0 ? `Fix ${failed[0].command} and rerun audit.` : "Run ship-check before release.",
    knownGaps: config.smokeUrls.length > 0 ? [] : ["No smoke URL is configured."]
  });

  const ok = !(failed.length > 0 || status === "production-blocked" || status === "not-runnable");
  return {
    command: "audit",
    ok,
    status,
    reportPath: report.markdownPath,
    details: { commandsRun: commandResults.length, failedCommands: failed.length }
  };
}
