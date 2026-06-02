import type { CommandResult, SmokeProfile } from "./types.js";

type SmokeCheckInput = {
  urls: string[];
  profiles: SmokeProfile[];
};

function statusOk(status: number, expectedStatus: number[]): boolean {
  if (expectedStatus.length > 0) return expectedStatus.includes(status);
  return status >= 200 && status < 400;
}

function resolveHeaders(headers: Record<string, string>): Record<string, string> {
  const resolved: Record<string, string> = {};
  for (const [key, value] of Object.entries(headers)) {
    if (value.startsWith("env:")) {
      const envValue = process.env[value.slice("env:".length)];
      if (envValue) resolved[key] = envValue;
    } else {
      resolved[key] = value;
    }
  }
  return resolved;
}

function profileCommand(profile: SmokeProfile): string {
  if (profile.name === profile.url && Object.keys(profile.headers).length === 0) return `${profile.method} ${profile.url}`;
  const headerNames = Object.keys(profile.headers);
  const suffix = headerNames.length > 0 ? `; headers: ${headerNames.join(", ")}` : "";
  return `${profile.method} ${profile.url} (${profile.name}${suffix})`;
}

async function runProfile(profile: SmokeProfile): Promise<CommandResult> {
  try {
    const response = await fetch(profile.url, {
      method: profile.method,
      headers: resolveHeaders(profile.headers),
      signal: AbortSignal.timeout(10_000)
    });
    const ok = statusOk(response.status, profile.expectedStatus);
    return {
      kind: "smoke",
      command: profileCommand(profile),
      exitCode: ok ? 0 : 1,
      stdout: ok ? `HTTP ${response.status}` : undefined,
      stderr: ok ? undefined : `HTTP ${response.status}`
    };
  } catch (error) {
    return {
      kind: "smoke",
      command: profileCommand(profile),
      exitCode: 1,
      stderr: error instanceof Error ? error.message : String(error)
    };
  }
}

export async function runSmokeChecks(input: SmokeCheckInput): Promise<CommandResult[]> {
  const results: CommandResult[] = [];
  for (const url of input.urls) {
    results.push(await runProfile({ name: url, url, method: "GET", expectedStatus: [], headers: {} }));
  }
  for (const profile of input.profiles) {
    results.push(await runProfile(profile));
  }
  return results;
}
