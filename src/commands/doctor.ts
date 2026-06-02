import { access } from "node:fs/promises";
import { join } from "node:path";
import { detectAgents } from "../core/agent-detection.js";
import type { CommandOutcome } from "../core/types.js";

async function canWriteAgentOps(cwd: string): Promise<boolean> {
  try {
    await access(join(cwd, "."));
    return true;
  } catch {
    return false;
  }
}

export async function doctor(cwd: string): Promise<CommandOutcome> {
  const agents = await detectAgents();
  const writable = await canWriteAgentOps(cwd);
  return {
    command: "doctor",
    ok: writable,
    status: writable ? "ready" : "blocked",
    details: {
      node: process.version,
      claude: agents.claude,
      codex: agents.codex,
      workspaceWritable: writable
    }
  };
}
