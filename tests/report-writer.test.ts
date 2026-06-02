import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, test } from "vitest";
import { writeReport } from "../src/core/report-writer";

describe("writeReport", () => {
  test("writes markdown and json metadata under .agentops", async () => {
    const cwd = await mkdtemp(join(tmpdir(), "agentops-report-"));
    const result = await writeReport(cwd, {
      kind: "audit",
      status: "demo-ready",
      scope: "test repo",
      commands: [{ kind: "test", command: "npm test", exitCode: 1, stderr: "expected failure output" }],
      verifiedFacts: ["package.json found"],
      inferredRisks: ["No test script found"],
      blockers: [],
      nextAction: "Add a test script.",
      knownGaps: ["No browser smoke configured."]
    });

    const markdown = await readFile(result.markdownPath, "utf8");
    const json = await readFile(result.jsonPath, "utf8");

    expect(markdown).toContain("# agentops-ai audit report");
    expect(markdown).toContain("## Summary");
    expect(markdown).toContain("## Command Output");
    expect(markdown).toContain("expected failure output");
    expect(markdown).toContain("package.json found");
    expect(JSON.parse(json).status).toBe("demo-ready");
  });
});
