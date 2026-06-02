import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { detectProject } from "../core/detect-project.js";
import { claudeWorkflowTemplate, codexWorkflowTemplate } from "../core/workflow-templates.js";

async function readTemplate(agent: "claude" | "codex"): Promise<string> {
  if (agent === "claude") return claudeWorkflowTemplate;
  return codexWorkflowTemplate;
}

export async function init(cwd: string): Promise<number> {
  const project = await detectProject(cwd);
  const root = join(cwd, ".agentops");
  await mkdir(join(root, "reports"), { recursive: true });
  await mkdir(join(root, "runs"), { recursive: true });
  await mkdir(join(root, "skills", "claude"), { recursive: true });
  await mkdir(join(root, "skills", "codex"), { recursive: true });

  await writeFile(
    join(root, "config.json"),
    `${JSON.stringify({ version: 1, project }, null, 2)}\n`
  );
  await writeFile(
    join(root, "memory.md"),
    "# agentops-ai Project Memory\n\n- Add project-specific decisions, recurring failures, and release notes here.\n",
    { flag: "a" }
  );
  await writeFile(join(root, "skills", "claude", "agentops.md"), await readTemplate("claude"));
  await writeFile(join(root, "skills", "codex", "agentops.md"), await readTemplate("codex"));

  console.log("agentops-ai initialized");
  console.log("Next: agentops-ai audit");
  return 0;
}
