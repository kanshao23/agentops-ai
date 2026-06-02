import { exec } from "node:child_process";
import { promisify } from "node:util";
import { detectAgents } from "../core/agent-detection.js";
import { writeReport } from "../core/report-writer.js";
import type { CommandOutcome } from "../core/types.js";

const execAsync = promisify(exec);

async function getDiff(cwd: string): Promise<string> {
  try {
    const result = await execAsync("git diff --stat && git diff --name-only", { cwd, timeout: 10_000 });
    return result.stdout.trim();
  } catch {
    return "";
  }
}

export async function review(cwd: string): Promise<CommandOutcome> {
  const agents = await detectAgents();
  const diff = await getDiff(cwd);
  const available = [
    agents.claude ? "Claude Code available" : "Claude Code missing",
    agents.codex ? "Codex available" : "Codex missing"
  ];
  const blockers = diff.length === 0 ? ["No git diff detected to review."] : [];
  const report = await writeReport(cwd, {
    kind: "review",
    status: blockers.length > 0 ? "manual-review" : "prompt-ready",
    scope: `Diff review for ${cwd}`,
    commands: [],
    verifiedFacts: available,
    inferredRisks: [
      "v0 prepares local review context but does not claim a second agent reviewed unless invoked by the user."
    ],
    blockers,
    nextAction:
      blockers.length > 0
        ? "Create a diff, then rerun review."
        : "Use the generated report as the prompt context for Claude Code and Codex.",
    knownGaps: ["Automatic dual-agent execution is outside v0."]
  });

  return {
    command: "review",
    ok: blockers.length === 0,
    status: blockers.length > 0 ? "manual-review" : "prompt-ready",
    reportPath: report.markdownPath,
    details: { claude: agents.claude, codex: agents.codex, hasDiff: diff.length > 0 }
  };
}
