import { createServer } from "node:http";
import { describe, expect, test } from "vitest";
import { runSmokeChecks } from "../src/core/smoke-checks";

function withServer(statusCode: number): Promise<{ url: string; close: () => Promise<void> }> {
  return new Promise((resolve) => {
    const server = createServer((_req, res) => {
      res.statusCode = statusCode;
      res.end("ok");
    });
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") throw new Error("Expected TCP address");
      resolve({
        url: `http://127.0.0.1:${address.port}/health`,
        close: () => new Promise((done) => server.close(() => done()))
      });
    });
  });
}

describe("runSmokeChecks", () => {
  test("passes 2xx URLs", async () => {
    const server = await withServer(204);
    try {
      const results = await runSmokeChecks([server.url]);
      expect(results).toEqual([{ kind: "smoke", command: `GET ${server.url}`, exitCode: 0, stdout: "HTTP 204" }]);
    } finally {
      await server.close();
    }
  });

  test("fails non-2xx and non-3xx URLs", async () => {
    const server = await withServer(500);
    try {
      const results = await runSmokeChecks([server.url]);
      expect(results[0].exitCode).toBe(1);
      expect(results[0].stderr).toBe("HTTP 500");
    } finally {
      await server.close();
    }
  });
});
