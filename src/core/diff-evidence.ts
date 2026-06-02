export type DiffEvidence = {
  hasDiff: boolean;
  stat: string;
  changedFiles: string[];
};

export function parseDiffEvidence(output: string): DiffEvidence {
  const lines = output
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter((line) => line.trim().length > 0);
  if (lines.length === 0) return { hasDiff: false, stat: "", changedFiles: [] };

  const changedFiles = lines.filter((line) => !line.includes("|") && !line.includes("files changed"));
  const statLines = lines.slice(0, Math.max(0, lines.length - changedFiles.length));
  return {
    hasDiff: changedFiles.length > 0 || statLines.length > 0,
    stat: statLines.join("\n"),
    changedFiles
  };
}
