import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, test } from "vitest";
import { loadConfig } from "../src/core/config";

describe("loadConfig", () => {
  test("loads custom commands and smoke URLs from .agentops/config.json", async () => {
    const cwd = await mkdtemp(join(tmpdir(), "agentops-config-"));
    await mkdir(join(cwd, ".agentops"), { recursive: true });
    await writeFile(
      join(cwd, ".agentops", "config.json"),
      JSON.stringify({
        commands: [{ kind: "custom", command: "npm run check:all" }],
        smokeUrls: ["http://localhost:3000/health"],
        smokeProfiles: [
          {
            name: "api",
            url: "http://localhost:3000/api/health",
            method: "HEAD",
            expectedStatus: [200, 204],
            headers: { Authorization: "env:SMOKE_TOKEN" }
          }
        ],
        allowDirty: true
      })
    );
    await writeFile(join(cwd, "package.json"), "{}");

    const config = await loadConfig(cwd);

    expect(config.commands).toEqual([{ kind: "custom", command: "npm run check:all" }]);
    expect(config.smokeUrls).toEqual(["http://localhost:3000/health"]);
    expect(config.smokeProfiles).toEqual([
      {
        name: "api",
        url: "http://localhost:3000/api/health",
        method: "HEAD",
        expectedStatus: [200, 204],
        headers: { Authorization: "env:SMOKE_TOKEN" }
      }
    ]);
    expect(config.allowDirty).toBe(true);
  });

  test("returns safe defaults when config is missing", async () => {
    const cwd = await mkdtemp(join(tmpdir(), "agentops-config-default-"));

    const config = await loadConfig(cwd);

    expect(config.commands).toEqual([]);
    expect(config.smokeUrls).toEqual([]);
    expect(config.smokeProfiles).toEqual([]);
    expect(config.allowDirty).toBe(false);
  });
});
