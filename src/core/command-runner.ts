import { exec } from "node:child_process";
import { promisify } from "node:util";
import type { CommandResult, VerificationCommand } from "./types.js";

const execAsync = promisify(exec);

export async function runCommand(command: VerificationCommand, cwd: string): Promise<CommandResult> {
  try {
    const result = await execAsync(command.command, {
      cwd,
      timeout: 120_000,
      maxBuffer: 1024 * 1024
    });
    return { ...command, exitCode: 0, stdout: result.stdout, stderr: result.stderr };
  } catch (error) {
    const err = error as { code?: number; stdout?: string; stderr?: string };
    return {
      ...command,
      exitCode: typeof err.code === "number" ? err.code : 1,
      stdout: err.stdout,
      stderr: err.stderr
    };
  }
}

export async function getGitDirty(cwd: string): Promise<boolean> {
  try {
    const result = await execAsync("git status --porcelain", { cwd, timeout: 10_000 });
    return result.stdout.trim().length > 0;
  } catch {
    return false;
  }
}
