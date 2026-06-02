import { execFile } from "node:child_process";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { promisify } from "node:util";
import { describe, expect, test } from "vitest";

const execFileAsync = promisify(execFile);

describe("CLI --json", () => {
  test("prints machine-readable doctor output", async () => {
    const cwd = await mkdtemp(join(tmpdir(), "agentops-cli-json-"));
    const cliPath = resolve("src/cli.ts");
    const tsxPath = resolve("node_modules", ".bin", "tsx");

    const result = await execFileAsync(tsxPath, [cliPath, "doctor", "--json"], { cwd });
    const parsed = JSON.parse(result.stdout) as Record<string, unknown>;

    expect(parsed.command).toBe("doctor");
    expect(parsed.ok).toBe(true);
  });
});
