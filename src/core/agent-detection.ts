import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export type AgentAvailability = {
  claude: boolean;
  codex: boolean;
};

async function hasCommand(command: string): Promise<boolean> {
  try {
    await execFileAsync("which", [command], { timeout: 5_000 });
    return true;
  } catch {
    return false;
  }
}

export async function detectAgents(): Promise<AgentAvailability> {
  return {
    claude: await hasCommand("claude"),
    codex: await hasCommand("codex")
  };
}
