import { getGitDirty, runCommand } from "../core/command-runner.js";
import { detectProject } from "../core/detect-project.js";
import { scanEnv } from "../core/env-scanner.js";
import { classifyShipStatus } from "../core/readiness.js";
import { writeReport } from "../core/report-writer.js";

export async function shipCheck(cwd: string): Promise<number> {
  const project = await detectProject(cwd);
  const env = await scanEnv(cwd);
  const gitDirty = await getGitDirty(cwd);
  const releaseCommands = project.verificationCommands.filter((command) =>
    ["lint", "typecheck", "test", "build"].includes(command.kind)
  );
  const commandResults = [];
  for (const command of releaseCommands) {
    commandResults.push(await runCommand(command, cwd));
  }

  const status = classifyShipStatus({ commandResults, missingEnvKeys: env.missingKeys, gitDirty });
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
    inferredRisks: gitDirty ? ["Working tree has uncommitted changes."] : [],
    blockers,
    nextAction: blockers.length > 0 ? "Resolve blockers and rerun ship-check." : "Prepare release notes from the report.",
    knownGaps: ["v0 does not deploy or call production services automatically."]
  });

  console.log(`Ship status: ${status}`);
  console.log(`Report: ${report.markdownPath}`);
  return status === "blocked" ? 1 : 0;
}
