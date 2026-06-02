# Roadmap

`agentops-ai` is intentionally small today. The near-term goal is to make the local reliability loop strong before adding heavier orchestration.

## Current Product Line

- Local CLI.
- Evidence-backed reports.
- Claude Code and Codex workflow templates.
- CI-friendly JSON output.
- Conservative release-readiness automation.

## Near-Term Work

### Explicit Claude/Codex Review Lanes

Issue: [#9](https://github.com/kanshao23/agentops-ai/issues/9)

Goal: let users explicitly configure Claude Code and Codex review lanes while preserving report attribution.

Guardrail: never claim a second agent reviewed unless the command actually ran and produced evidence.

### Browser and API Smoke Profiles

Issue: [#10](https://github.com/kanshao23/agentops-ai/issues/10)

Goal: let projects define named smoke profiles with URLs, expected status ranges, and safe headers.

Guardrail: do not require a browser or production URL by default.

### More Framework Detection

Issue: [#11](https://github.com/kanshao23/agentops-ai/issues/11)

Goal: expand project detection one framework at a time, with tests.

Good starter shape:

- Add dependency signal.
- Add detection test.
- Update README if the public list changes.

## Later Work

- GitHub Action wrapper for PR comments.
- Release note generation from reports.
- Project memory update workflow.
- npm publication.
- Optional local dashboard.

## Contribution Rules

- Keep changes local-first.
- Add tests for detection and classification behavior.
- Keep reports clear about verified facts versus inferred risks.
- Avoid broad platform work before the CLI/report contract is stable.
