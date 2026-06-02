import { describe, expect, test } from "vitest";
import { parseDiffEvidence } from "../src/core/diff-evidence";

describe("parseDiffEvidence", () => {
  test("extracts changed files and stat text", () => {
    const evidence = parseDiffEvidence(` README.md | 4 +++-
 src/cli.ts | 2 ++
 2 files changed, 5 insertions(+), 1 deletion(-)
README.md
src/cli.ts`);

    expect(evidence.hasDiff).toBe(true);
    expect(evidence.changedFiles).toEqual(["README.md", "src/cli.ts"]);
    expect(evidence.stat).toContain("2 files changed");
  });

  test("handles empty diff output", () => {
    const evidence = parseDiffEvidence("");

    expect(evidence.hasDiff).toBe(false);
    expect(evidence.changedFiles).toEqual([]);
    expect(evidence.stat).toBe("");
  });
});
