#!/usr/bin/env node
import { audit } from "./commands/audit.js";
import { doctor } from "./commands/doctor.js";
import { init } from "./commands/init.js";
import { review } from "./commands/review.js";
import { shipCheck } from "./commands/ship-check.js";

function usage(): void {
  console.log(`agentops-ai

Usage:
  agentops-ai init
  agentops-ai audit
  agentops-ai review
  agentops-ai ship-check
  agentops-ai doctor`);
}

async function main(): Promise<number> {
  const command = process.argv[2];
  const cwd = process.cwd();
  if (!command || command === "--help" || command === "-h") {
    usage();
    return 0;
  }
  if (command === "init") return init(cwd);
  if (command === "audit") return audit(cwd);
  if (command === "review") return review(cwd);
  if (command === "ship-check") return shipCheck(cwd);
  if (command === "doctor") return doctor(cwd);
  console.error(`Unknown command: ${command}`);
  usage();
  return 1;
}

main()
  .then((code) => {
    process.exitCode = code;
  })
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
