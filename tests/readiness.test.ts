import { describe, expect, test } from "vitest";
import { classifyReadiness, classifyShipStatus } from "../src/core/readiness";

describe("readiness", () => {
  test("blocks production when build fails", () => {
    const status = classifyReadiness({
      hasPackage: true,
      commandResults: [{ kind: "build", command: "npm run build", exitCode: 1 }],
      missingEnvKeys: [],
      gitDirty: false
    });

    expect(status).toBe("production-blocked");
  });

  test("marks beta-ready when verification passes but git is dirty", () => {
    const status = classifyReadiness({
      hasPackage: true,
      commandResults: [
        { kind: "build", command: "npm run build", exitCode: 0 },
        { kind: "test", command: "npm test", exitCode: 0 }
      ],
      missingEnvKeys: [],
      gitDirty: true
    });

    expect(status).toBe("beta-ready");
  });

  test("ship-check is blocked by missing env keys", () => {
    const status = classifyShipStatus({
      commandResults: [{ kind: "build", command: "npm run build", exitCode: 0 }],
      missingEnvKeys: ["DATABASE_URL"],
      gitDirty: false
    });

    expect(status).toBe("blocked");
  });
});
