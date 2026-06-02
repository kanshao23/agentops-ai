import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { promisify } from "node:util";
import { describe, expect, test } from "vitest";

const execFileAsync = promisify(execFile);

describe("CLI version", () => {
  test("prints package version with --version", async () => {
    const packageJson = JSON.parse(await readFile(resolve("package.json"), "utf8")) as { version: string };
    const tsxPath = resolve("node_modules", ".bin", "tsx");
    const cliPath = resolve("src/cli.ts");

    const result = await execFileAsync(tsxPath, [cliPath, "--version"]);

    expect(result.stdout.trim()).toBe(packageJson.version);
  });
});
