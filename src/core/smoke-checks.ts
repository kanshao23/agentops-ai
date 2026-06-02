import type { CommandResult } from "./types.js";

export async function runSmokeChecks(urls: string[]): Promise<CommandResult[]> {
  const results: CommandResult[] = [];
  for (const url of urls) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(10_000) });
      const ok = response.status >= 200 && response.status < 400;
      results.push({
        kind: "smoke",
        command: `GET ${url}`,
        exitCode: ok ? 0 : 1,
        stdout: ok ? `HTTP ${response.status}` : undefined,
        stderr: ok ? undefined : `HTTP ${response.status}`
      });
    } catch (error) {
      results.push({
        kind: "smoke",
        command: `GET ${url}`,
        exitCode: 1,
        stderr: error instanceof Error ? error.message : String(error)
      });
    }
  }
  return results;
}
