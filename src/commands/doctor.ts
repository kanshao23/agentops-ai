import { access } from "node:fs/promises";
import { join } from "node:path";
import { detectAgents } from "../core/agent-detection.js";

async function canWriteAgentOps(cwd: string): Promise<boolean> {
  try {
    await access(join(cwd, "."));
    return true;
  } catch {
    return false;
  }
}

export async function doctor(cwd: string): Promise<number> {
  const agents = await detectAgents();
  const writable = await canWriteAgentOps(cwd);
  console.log("agentops-ai doctor");
  console.log(`node: ${process.version}`);
  console.log(`claude: ${agents.claude ? "found" : "missing"}`);
  console.log(`codex: ${agents.codex ? "found" : "missing"}`);
  console.log(`workspace writable: ${writable ? "yes" : "no"}`);
  return writable ? 0 : 1;
}
