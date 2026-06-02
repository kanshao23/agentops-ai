import { createServer, type IncomingMessage } from "node:http";
import { describe, expect, test } from "vitest";
import { runSmokeChecks } from "../src/core/smoke-checks";

function withServer(
  statusCode: number,
  onRequest?: (req: IncomingMessage) => void
): Promise<{ url: string; close: () => Promise<void> }> {
  return new Promise((resolve) => {
    const server = createServer((req, res) => {
      onRequest?.(req);
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
      const results = await runSmokeChecks({ urls: [server.url], profiles: [] });
      expect(results).toEqual([{ kind: "smoke", command: `GET ${server.url}`, exitCode: 0, stdout: "HTTP 204" }]);
    } finally {
      await server.close();
    }
  });

  test("passes explicit status profiles and redacts header values", async () => {
    const seen: string[] = [];
    process.env.AGENTOPS_TEST_TOKEN = "secret-token";
    const server = await withServer(202, (req) => {
      seen.push(`${req.method ?? ""}:${req.headers.authorization ?? ""}`);
    });
    try {
      const results = await runSmokeChecks({
        urls: [],
        profiles: [
          {
            name: "worker",
            url: server.url,
            method: "POST",
            expectedStatus: [202],
            headers: { Authorization: "env:AGENTOPS_TEST_TOKEN" }
          }
        ]
      });

      expect(seen).toEqual(["POST:secret-token"]);
      expect(results[0]).toMatchObject({
        kind: "smoke",
        command: `POST ${server.url} (worker; headers: Authorization)`,
        exitCode: 0,
        stdout: "HTTP 202"
      });
      expect(JSON.stringify(results)).not.toContain("secret-token");
    } finally {
      delete process.env.AGENTOPS_TEST_TOKEN;
      await server.close();
    }
  });

  test("fails non-2xx and non-3xx URLs", async () => {
    const server = await withServer(500);
    try {
      const results = await runSmokeChecks({ urls: [server.url], profiles: [] });
      expect(results[0].exitCode).toBe(1);
      expect(results[0].stderr).toBe("HTTP 500");
    } finally {
      await server.close();
    }
  });
});
