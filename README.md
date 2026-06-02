# agentops-ai

**Reliability workflows for Claude Code and Codex.**

`agentops-ai` is an open-source toolkit that helps developers verify whether AI-generated code is actually ready to demo, merge, or ship.

The core idea is simple:

> Stop trusting one agent. Make agents verify the work.

AI coding agents are fast, but speed creates a new problem: it is easy for a change to look finished while tests fail, env keys are missing, release steps are undocumented, or another part of the app quietly broke. `agentops-ai` gives Claude Code, Codex, and humans a shared reliability workflow built around local evidence.

## What It Does

`agentops-ai` starts as a local CLI. It inspects a repository, runs safe verification commands, writes Markdown/JSON reports, and installs workflow instructions that Claude Code and Codex can reuse.

It answers practical questions:

- Can this project run?
- Did lint, typecheck, tests, and build pass?
- Are documented env keys available locally?
- Is the working tree clean enough to ship?
- What is verified by commands, and what is only an inferred risk?
- What should be fixed first?

## Why This Exists

Claude Code and Codex are powerful, but they are usually judged by the final message they write. That is not enough.

Developers need a reliability layer that keeps evidence separate from confidence:

- **Verified fact:** `npm run build` exited `0`.
- **Verified blocker:** `npm test` exited `1`.
- **Inferred risk:** `.env.example` documents `DATABASE_URL`, but no local env file contains that key.
- **Known gap:** no browser smoke URL was configured.

`agentops-ai` turns those facts into a repeatable report.

## Current Status

This is an early v0 scaffold.

Implemented now:

- TypeScript CLI.
- `doctor`, `init`, `audit`, `review`, and `ship-check` commands.
- Project and package-manager detection.
- Verification command detection for common npm scripts.
- Env key scanning without printing secret values.
- Readiness and ship-status classification.
- Markdown reports under `.agentops/reports/`.
- JSON run metadata under `.agentops/runs/`.
- Local Claude Code and Codex workflow files.

Not implemented yet:

- Automatic dual-agent execution.
- GitHub Action workflow.
- Browser smoke configuration.
- Hosted dashboard.
- Desktop app.
- npm publication.

## Quick Start

From an existing project:

```bash
npx agentops-ai init
npx agentops-ai audit
```

Optional global install:

```bash
npm install -g agentops-ai
agentops-ai init
agentops-ai audit
```

For local development from this repository:

```bash
npm install
npm test
npm run build
node dist/cli.js doctor
```

## Commands

### `agentops-ai doctor`

Checks whether the local environment can run the toolkit.

It reports:

- Node.js version.
- Whether `claude` is available on `PATH`.
- Whether `codex` is available on `PATH`.
- Whether the workspace is writable.

Example:

```text
agentops-ai doctor
node: v25.9.0
claude: found
codex: found
workspace writable: yes
```

### `agentops-ai init`

Initializes `.agentops/` in the current project.

Generated files:

```text
.agentops/
  config.json
  memory.md
  reports/
  runs/
  skills/
    claude/
      agentops.md
    codex/
      agentops.md
```

`init` is designed to be safe to run more than once. It does not overwrite `AGENTS.md`, `CLAUDE.md`, `.env`, or package scripts.

### `agentops-ai audit`

Runs a local readiness audit.

It detects:

- Package manager: `npm`, `pnpm`, `yarn`, or `bun`.
- Framework signals such as Next.js, Vite, React, Vue, Svelte, Astro, and Express.
- Verification scripts: `lint`, `typecheck`, `test`, and `build`.
- Documented env keys from `.env.example`, `.env.sample`, or `.env.template`.
- Available local env keys from `.env` and `.env.local`, without printing values.
- Git dirty state.

Readiness statuses:

- `not-runnable`
- `demo-ready`
- `beta-ready`
- `production-blocked`
- `production-ready`

Example output:

```text
Status: beta-ready
Report: /path/to/project/.agentops/reports/audit-20260602-000103.md
```

### `agentops-ai ship-check`

Runs a stricter release-oriented check.

Ship statuses:

- `blocked`
- `manual-review`
- `ready`

Examples:

```text
Ship status: blocked
Report: /path/to/project/.agentops/reports/ship-check-20260602-000052.md
```

```text
Ship status: manual-review
Report: /path/to/project/.agentops/reports/ship-check-20260602-000104.md
```

`manual-review` usually means the commands passed but human judgment is still needed, for example because the working tree is dirty.

### `agentops-ai review`

Prepares a local diff review report.

In v0, this command:

- Checks whether Claude Code and Codex are available.
- Inspects whether a git diff exists.
- Writes a report that can be used as prompt context for Claude Code or Codex.
- Clearly states that automatic dual-agent execution is outside v0.

Important: `agentops-ai` does **not** claim Claude Code or Codex reviewed the code unless that actually happened.

## Report Format

Reports are written as Markdown and JSON.

Markdown:

```text
.agentops/reports/audit-YYYYMMDD-HHMMSS.md
.agentops/reports/ship-check-YYYYMMDD-HHMMSS.md
.agentops/reports/review-YYYYMMDD-HHMMSS.md
```

JSON metadata:

```text
.agentops/runs/audit-YYYYMMDD-HHMMSS.json
.agentops/runs/ship-check-YYYYMMDD-HHMMSS.json
.agentops/runs/review-YYYYMMDD-HHMMSS.json
```

Every report contains:

- Status.
- Scope.
- Commands run.
- Verified facts.
- Inferred risks.
- Blockers.
- Recommended next action.
- Known gaps.

Example report shape:

```markdown
# agentops-ai audit report

Status: `production-blocked`

## Scope

npm project at /path/to/project

## Commands Run

- `npm run lint` -> exit 0
- `npm run test` -> exit 1
- `npm run build` -> exit 0

## Verified Facts

- package.json found
- Framework signals: next, react
- Documented env keys: 3
- Git dirty: yes

## Inferred Risks

- Documented env key is not available locally: DATABASE_URL

## Blockers

- Command failed: npm run test

## Recommended Next Action

Fix npm run test and rerun audit.

## Known Gaps

- No browser smoke URL is configured in v0.
```

## Claude Code and Codex Integration

`agentops-ai init` creates local workflow files:

```text
.agentops/skills/claude/agentops.md
.agentops/skills/codex/agentops.md
```

These files tell agents to:

- Prefer `agentops-ai audit`, `agentops-ai review`, and `agentops-ai ship-check`.
- Cite exact commands and exit codes.
- Separate verified facts from inferred risks.
- Avoid printing secret values.
- Write reports under `.agentops/reports/`.

The goal is to give Claude Code and Codex a shared reliability contract, not to replace either tool.

## Safety Model

`agentops-ai` is intentionally conservative.

It will:

- Run local verification commands detected from package scripts.
- Write reports to `.agentops/`.
- Read env key names from env files.
- Detect whether Claude Code and Codex are installed.

It will not:

- Print secret env values.
- Deploy to production.
- Run destructive git commands.
- Overwrite `AGENTS.md`, `CLAUDE.md`, `.env`, or package scripts.
- Claim another agent reviewed the code without evidence.
- Depend on private Claude Code or Codex APIs.

## Architecture

```text
agentops-ai/
  src/
    cli.ts
    commands/
      audit.ts
      doctor.ts
      init.ts
      review.ts
      ship-check.ts
    core/
      agent-detection.ts
      command-runner.ts
      detect-project.ts
      env-scanner.ts
      readiness.ts
      report-writer.ts
      types.ts
      workflow-templates.ts
    templates/
      claude/
      codex/
  tests/
    detect-project.test.ts
    env-scanner.test.ts
    readiness.test.ts
    report-writer.test.ts
```

Core modules:

- `detect-project`: detects package manager, frameworks, and verification commands.
- `env-scanner`: reads env key names while redacting values.
- `readiness`: classifies audit and ship-check status.
- `report-writer`: writes Markdown reports and JSON metadata.
- `agent-detection`: checks local Claude Code and Codex availability.
- `command-runner`: runs local commands with captured exit codes.

## Development

Install dependencies:

```bash
npm install
```

Run tests:

```bash
npm test
```

Build:

```bash
npm run build
```

Run the CLI locally:

```bash
node dist/cli.js doctor
node dist/cli.js init
node dist/cli.js audit
```

## Verification

The current v0 has tests for:

- Project detection.
- Env scanning without leaking secret values.
- Readiness classification.
- Report writing.

Expected checks before opening a PR:

```bash
npm test
npm run build
npm audit --audit-level=critical
```

## Roadmap

Near-term:

- Add config-driven command selection.
- Add browser smoke URL checks.
- Add GitHub Action mode.
- Add better diff summaries for `review`.
- Add generated prompt bundles for Claude Code and Codex.

Medium-term:

- Run Claude/Codex review lanes when explicitly configured.
- Merge dual-agent findings into confirmed, disputed, and unresolved buckets.
- Add release-note generation.
- Add project memory update workflows.
- Add package publication to npm.

Long-term:

- Optional local web dashboard.
- Historical readiness trends.
- Plugin surfaces for more agent CLIs.
- Team workflows for explore, execute, review, and verify lanes.

## Positioning

`agentops-ai` is not another giant skills collection.

It is a reliability layer:

- small enough to install quickly;
- strict enough to avoid fake confidence;
- useful even when only one agent is installed;
- better when Claude Code and Codex are both available.

## Contributing

Issues and pull requests are welcome.

Good first contributions:

- Add detection for another framework.
- Improve report wording.
- Add tests for a package manager edge case.
- Add a safe smoke-check mode.
- Improve Claude/Codex workflow templates.

Please keep the project local-first, evidence-backed, and conservative with side effects.

## License

MIT
