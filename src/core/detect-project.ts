import { access, readFile } from "node:fs/promises";
import { join } from "node:path";
import type { ProjectInfo, VerificationCommand, VerificationKind } from "./types.js";

async function exists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

function commandFor(packageManager: ProjectInfo["packageManager"], script: string): string {
  if (packageManager === "pnpm") return `pnpm ${script}`;
  if (packageManager === "yarn") return `yarn ${script}`;
  if (packageManager === "bun") return `bun run ${script}`;
  return `npm run ${script}`;
}

function detectFrameworkNames(packageJson: Record<string, unknown>): string[] {
  const deps = {
    ...(packageJson.dependencies as Record<string, string> | undefined),
    ...(packageJson.devDependencies as Record<string, string> | undefined)
  };
  const frameworks: string[] = [];
  for (const name of ["next", "vite", "react", "vue", "svelte", "astro", "express"]) {
    if (deps[name]) frameworks.push(name);
  }
  if (deps["@remix-run/react"] || deps["@remix-run/node"] || deps["@remix-run/dev"]) frameworks.push("remix");
  return frameworks;
}

function detectVerificationCommands(
  packageManager: ProjectInfo["packageManager"],
  scripts: Record<string, string>
): VerificationCommand[] {
  const candidates: Array<[VerificationKind, string[]]> = [
    ["lint", ["lint"]],
    ["typecheck", ["typecheck", "type-check"]],
    ["test", ["test"]],
    ["build", ["build"]]
  ];
  const commands: VerificationCommand[] = [];
  for (const [kind, scriptNames] of candidates) {
    const scriptName = scriptNames.find((name) => scripts[name]);
    if (scriptName) commands.push({ kind, command: commandFor(packageManager, scriptName) });
  }
  return commands;
}

export async function detectProject(cwd: string): Promise<ProjectInfo> {
  const packageManager = (await exists(join(cwd, "pnpm-lock.yaml")))
    ? "pnpm"
    : (await exists(join(cwd, "yarn.lock")))
      ? "yarn"
      : (await exists(join(cwd, "bun.lockb")))
        ? "bun"
        : (await exists(join(cwd, "package-lock.json")))
          ? "npm"
          : "unknown";

  const packagePath = join(cwd, "package.json");
  const hasPackage = await exists(packagePath);
  if (!hasPackage) {
    return { root: cwd, hasPackage, packageManager, frameworks: [], verificationCommands: [] };
  }

  const packageJson = JSON.parse(await readFile(packagePath, "utf8")) as Record<string, unknown>;
  const scripts = (packageJson.scripts as Record<string, string> | undefined) ?? {};

  return {
    root: cwd,
    hasPackage,
    packageManager: packageManager === "unknown" ? "npm" : packageManager,
    frameworks: detectFrameworkNames(packageJson),
    verificationCommands: detectVerificationCommands(packageManager === "unknown" ? "npm" : packageManager, scripts)
  };
}
