import { access, readFile } from "node:fs/promises";
import { join } from "node:path";
import type { EnvScanResult } from "./types.js";

const documentedEnvFiles = [".env.example", ".env.sample", ".env.template"];
const localEnvFiles = [".env", ".env.local"];

async function readIfExists(path: string): Promise<string | null> {
  try {
    await access(path);
    return await readFile(path, "utf8");
  } catch {
    return null;
  }
}

function parseKeys(content: string): string[] {
  const keys = new Set<string>();
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=/);
    if (match) keys.add(match[1]);
  }
  return [...keys].sort();
}

export async function scanEnv(cwd: string): Promise<EnvScanResult> {
  const documentedKeys = new Set<string>();
  const availableKeys = new Set<string>();
  const filesRead: string[] = [];

  for (const file of documentedEnvFiles) {
    const content = await readIfExists(join(cwd, file));
    if (content === null) continue;
    filesRead.push(file);
    for (const key of parseKeys(content)) documentedKeys.add(key);
  }

  for (const file of localEnvFiles) {
    const content = await readIfExists(join(cwd, file));
    if (content === null) continue;
    filesRead.push(file);
    for (const key of parseKeys(content)) availableKeys.add(key);
  }

  const documented = [...documentedKeys].sort();
  const available = [...availableKeys].sort();
  return {
    documentedKeys: documented,
    availableKeys: available,
    missingKeys: documented.filter((key) => !availableKeys.has(key)),
    filesRead
  };
}
