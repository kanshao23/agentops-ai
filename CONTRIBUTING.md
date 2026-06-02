# Contributing

Thanks for helping improve `agentops-ai`.

## Principles

- Keep the tool local-first.
- Prefer verified command evidence over model confidence.
- Do not print secret values.
- Avoid destructive side effects.
- Do not claim an agent reviewed code unless that actually happened.

## Local Setup

```bash
npm install
npm test
npm run build
```

## Before Opening a PR

Run:

```bash
npm test
npm run build
npm audit --audit-level=critical
npm pack --dry-run
```

## Good First Issues

- Add detection for another framework.
- Improve README examples.
- Add tests for package-manager edge cases.
- Improve report wording.
- Add a safe smoke-check adapter.

## Pull Request Guidance

Explain:

- What reliability problem the change solves.
- What commands you ran.
- Any remaining gaps or risks.

Keep changes small and evidence-backed.
