import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, test } from "vitest";
import { detectProject } from "../src/core/detect-project";

describe("detectProject", () => {
  test("detects package manager, framework, and verification scripts", async () => {
    const cwd = await mkdtemp(join(tmpdir(), "agentops-detect-"));
    await writeFile(join(cwd, "pnpm-lock.yaml"), "");
    await writeFile(
      join(cwd, "package.json"),
      JSON.stringify({
        dependencies: { next: "16.0.0" },
        scripts: {
          build: "next build",
          lint: "next lint",
          typecheck: "tsc --noEmit",
          test: "vitest run"
        }
      })
    );

    const project = await detectProject(cwd);

    expect(project.packageManager).toBe("pnpm");
    expect(project.frameworks).toContain("next");
    expect(project.verificationCommands.map((command) => command.kind)).toEqual([
      "lint",
      "typecheck",
      "test",
      "build"
    ]);
  });

  test("detects Remix framework signal", async () => {
    const cwd = await mkdtemp(join(tmpdir(), "agentops-remix-"));
    await writeFile(
      join(cwd, "package.json"),
      JSON.stringify({
        dependencies: { "@remix-run/react": "2.0.0" },
        scripts: { build: "remix vite:build" }
      })
    );

    const project = await detectProject(cwd);

    expect(project.frameworks).toContain("remix");
  });
});
