import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { ReportInput, WrittenReport } from "./types.js";

function timestamp(): string {
  return new Date().toISOString().replace(/[-:]/g, "").replace(/\..+$/, "").replace("T", "-");
}

function list(items: string[]): string {
  return items.length > 0 ? items.map((item) => `- ${item}`).join("\n") : "- None";
}

function commandList(commands: ReportInput["commands"]): string {
  if (commands.length === 0) return "- None";
  return commands.map((command) => `- \`${command.command}\` -> exit ${command.exitCode}`).join("\n");
}

function truncateOutput(output: string): string {
  const normalized = output.trim();
  if (normalized.length <= 1200) return normalized;
  return `${normalized.slice(0, 1200)}\n... truncated ...`;
}

function commandOutput(commands: ReportInput["commands"]): string {
  const withOutput = commands.filter((command) => command.stdout || command.stderr);
  if (withOutput.length === 0) return "- None captured";
  return withOutput
    .map((command) => {
      const output = truncateOutput(command.stderr || command.stdout || "");
      return `### \`${command.command}\`\n\nExit code: \`${command.exitCode}\`\n\n\`\`\`text\n${output}\n\`\`\``;
    })
    .join("\n\n");
}

function summary(input: ReportInput): string {
  const failed = input.commands.filter((command) => command.exitCode !== 0).length;
  return [
    `- Status: \`${input.status}\``,
    `- Commands: ${input.commands.length} run, ${failed} failed`,
    `- Blockers: ${input.blockers.length}`,
    `- Known gaps: ${input.knownGaps.length}`
  ].join("\n");
}

export async function writeReport(cwd: string, input: ReportInput): Promise<WrittenReport> {
  const reportsDir = join(cwd, ".agentops", "reports");
  const runsDir = join(cwd, ".agentops", "runs");
  await mkdir(reportsDir, { recursive: true });
  await mkdir(runsDir, { recursive: true });

  const id = `${input.kind}-${timestamp()}`;
  const markdownPath = join(reportsDir, `${id}.md`);
  const jsonPath = join(runsDir, `${id}.json`);
  const markdown = `# agentops-ai ${input.kind} report

Status: \`${input.status}\`

## Summary

${summary(input)}

## Scope

${input.scope}

## Commands Run

${commandList(input.commands)}

## Command Output

${commandOutput(input.commands)}

## Verified Facts

${list(input.verifiedFacts)}

## Inferred Risks

${list(input.inferredRisks)}

## Blockers

${list(input.blockers)}

## Recommended Next Action

${input.nextAction}

## Known Gaps

${list(input.knownGaps)}
`;

  await writeFile(markdownPath, markdown);
  await writeFile(jsonPath, `${JSON.stringify(input, null, 2)}\n`);
  return { markdownPath, jsonPath };
}
