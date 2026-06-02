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

## Scope

${input.scope}

## Commands Run

${commandList(input.commands)}

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
