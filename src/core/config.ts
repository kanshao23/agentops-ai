import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { AgentOpsConfig, SmokeProfile, VerificationCommand, VerificationKind } from "./types.js";

const defaultConfig: AgentOpsConfig = {
  version: 1,
  commands: [],
  smokeUrls: [],
  smokeProfiles: [],
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

function parseMethod(value: unknown): SmokeProfile["method"] {
  if (value === "HEAD" || value === "POST") return value;
  return "GET";
}

function parseStatusList(value: unknown): number[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is number => Number.isInteger(item) && item >= 100 && item <= 599);
}

function parseHeaders(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const headers: Record<string, string> = {};
  for (const [key, headerValue] of Object.entries(value)) {
    if (/^[A-Za-z0-9-]+$/.test(key) && typeof headerValue === "string") headers[key] = headerValue;
  }
  return headers;
}

function parseSmokeProfiles(value: unknown): SmokeProfile[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const candidate = item as Record<string, unknown>;
    if (typeof candidate.name !== "string" || typeof candidate.url !== "string") return [];
    return [
      {
        name: candidate.name,
        url: candidate.url,
        method: parseMethod(candidate.method),
        expectedStatus: parseStatusList(candidate.expectedStatus),
        headers: parseHeaders(candidate.headers)
      }
    ];
  });
}

export async function loadConfig(cwd: string): Promise<AgentOpsConfig> {
  try {
    const raw = await readFile(join(cwd, ".agentops", "config.json"), "utf8");
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return {
      version: typeof parsed.version === "number" ? parsed.version : 1,
      commands: parseCommands(parsed.commands),
      smokeUrls: parseStrings(parsed.smokeUrls),
      smokeProfiles: parseSmokeProfiles(parsed.smokeProfiles),
      allowDirty: parsed.allowDirty === true
    };
  } catch {
    return defaultConfig;
  }
}
