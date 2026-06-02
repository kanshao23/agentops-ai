import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, test } from "vitest";
import { scanEnv } from "../src/core/env-scanner";

describe("scanEnv", () => {
  test("reports documented keys without exposing local secret values", async () => {
    const cwd = await mkdtemp(join(tmpdir(), "agentops-env-"));
    await writeFile(join(cwd, ".env.example"), "STRIPE_SECRET_KEY=\nNEXT_PUBLIC_URL=http://localhost:3000\n");
    await writeFile(join(cwd, ".env.local"), "STRIPE_SECRET_KEY=sk_live_secret\nNEXT_PUBLIC_URL=http://localhost:3000\n");

    const result = await scanEnv(cwd);

    expect(result.documentedKeys).toContain("STRIPE_SECRET_KEY");
    expect(result.availableKeys).toContain("STRIPE_SECRET_KEY");
    expect(JSON.stringify(result)).not.toContain("sk_live_secret");
  });
});
