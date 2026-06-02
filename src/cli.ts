#!/usr/bin/env node
import { audit } from "./commands/audit.js";
import { doctor } from "./commands/doctor.js";
import { init } from "./commands/init.js";
import { review } from "./commands/review.js";
import { shipCheck } from "./commands/ship-check.js";
import type { CommandOutcome } from "./core/types.js";

function usage(): void {
  console.log(`agentops-ai

Usage:
  agentops-ai init
  agentops-ai audit
  agentops-ai review
  agentops-ai ship-check
  agentops-ai doctor

Options:
  --json    Print machine-readable JSON`);
}

function printOutcome(outcome: CommandOutcome, json: boolean): void {
  if (json) {
    console.log(JSON.stringify(outcome, null, 2));
    return;
  }

  if (outcome.command === "doctor") {
    console.log("agentops-ai doctor");
    console.log(`node: ${String(outcome.details?.node)}`);
    console.log(`claude: ${outcome.details?.claude ? "found" : "missing"}`);
    console.log(`codex: ${outcome.details?.codex ? "found" : "missing"}`);
    console.log(`workspace writable: ${outcome.details?.workspaceWritable ? "yes" : "no"}`);
    return;
  }

  if (outcome.command === "init") {
    console.log("agentops-ai initialized");
    console.log(`Next: ${String(outcome.details?.next)}`);
    return;
  }

  if (outcome.status) console.log(`${outcome.command} status: ${outcome.status}`);
  if (outcome.reportPath) console.log(`Report: ${outcome.reportPath}`);
}

async function main(): Promise<number> {
  const command = process.argv[2];
  const json = process.argv.includes("--json");
  const cwd = process.cwd();
  if (!command || command === "--help" || command === "-h") {
    usage();
    return 0;
  }
  let outcome: CommandOutcome;
  if (command === "init") outcome = await init(cwd);
  else if (command === "audit") outcome = await audit(cwd);
  else if (command === "review") outcome = await review(cwd);
  else if (command === "ship-check") outcome = await shipCheck(cwd);
  else if (command === "doctor") outcome = await doctor(cwd);
  else {
    console.error(`Unknown command: ${command}`);
    usage();
    return 1;
  }
  printOutcome(outcome, json);
  return outcome.ok ? 0 : 1;
}

main()
  .then((code) => {
    process.exitCode = code;
  })
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
