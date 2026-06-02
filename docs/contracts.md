# agentops-ai Contracts

This document describes the machine-readable contracts that external scripts, CI jobs, and agents can rely on.

## `.agentops/config.json`

`agentops-ai init` creates a config file under `.agentops/config.json`.

```json
{
  "version": 1,
  "commands": [
    { "kind": "lint", "command": "npm run lint" },
    { "kind": "typecheck", "command": "npm run typecheck" },
    { "kind": "test", "command": "npm test" },
    { "kind": "build", "command": "npm run build" }
  ],
  "smokeUrls": ["http://localhost:3000/health"],
  "allowDirty": false
}
```

### Fields

- `version`: config format version. Current value is `1`.
- `commands`: optional explicit verification commands. If empty, commands are detected from package scripts.
- `smokeUrls`: HTTP URLs to request during `audit` and `ship-check`.
- `allowDirty`: when `true`, `ship-check` does not downgrade status because of uncommitted changes.

### Command Kinds

Valid `kind` values:

- `lint`
- `typecheck`
- `test`
- `build`
- `smoke`
- `custom`

## CLI JSON Output

All commands support `--json`.

```bash
agentops-ai audit --json
```

Shape:

```json
{
  "command": "audit",
  "ok": true,
  "status": "beta-ready",
  "reportPath": "/path/to/project/.agentops/reports/audit-20260602-001746.md",
  "details": {
    "commandsRun": 4,
    "failedCommands": 0
  }
}
```

### Common Fields

- `command`: command name.
- `ok`: whether the command considers the result successful.
- `status`: command-specific status string.
- `reportPath`: Markdown report path when the command writes one.
- `details`: command-specific metadata.

## Status Values

### `audit`

- `not-runnable`
- `demo-ready`
- `beta-ready`
- `production-blocked`
- `production-ready`

### `ship-check`

- `blocked`
- `manual-review`
- `ready`

### `review`

- `manual-review`
- `prompt-ready`

### `doctor`

- `ready`
- `blocked`

## Report JSON

Each report has a JSON companion under `.agentops/runs/`.

```json
{
  "kind": "audit",
  "status": "production-blocked",
  "scope": "npm project at /path/to/project",
  "commands": [
    {
      "kind": "test",
      "command": "npm test",
      "exitCode": 1,
      "stderr": "test failure output"
    }
  ],
  "verifiedFacts": ["package.json found"],
  "inferredRisks": ["Documented env key is not available locally: DATABASE_URL"],
  "blockers": ["Command failed: npm test"],
  "nextAction": "Fix npm test and rerun audit.",
  "knownGaps": ["No smoke URL is configured."]
}
```

## CI Usage

Example gate:

```bash
result="$(agentops-ai ship-check --json)"
echo "$result"
echo "$result" | node -e "let input=''; process.stdin.on('data', d => input += d); process.stdin.on('end', () => process.exit(JSON.parse(input).ok ? 0 : 1));"
```
