import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { AgentOpsConfig, VerificationCommand, VerificationKind } from "./types.js";

const defaultConfig: AgentOpsConfig = {
  version: 1,
  commands: [],
  smokeUrls: [],
  allowDirty: false
};

function isVerificationKind(value: unknown): value is VerificationKind {
  return ["lint", "typecheck", "test", "build", "smoke", "custom"].includes(String(value));
}

function parseCommands(value: unknown): VerificationCommand[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const candidate = item as Record<string, unknown>;
    if (!isVerificationKind(candidate.kind) || typeof candidate.command !== "string") return [];
    return [{ kind: candidate.kind, command: candidate.command }];
  });
}

function parseStrings(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.length > 0);
}

export async function loadConfig(cwd: string): Promise<AgentOpsConfig> {
  try {
    const raw = await readFile(join(cwd, ".agentops", "config.json"), "utf8");
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return {
      version: typeof parsed.version === "number" ? parsed.version : 1,
      commands: parseCommands(parsed.commands),
      smokeUrls: parseStrings(parsed.smokeUrls),
      allowDirty: parsed.allowDirty === true
    };
  } catch {
    return defaultConfig;
  }
}
