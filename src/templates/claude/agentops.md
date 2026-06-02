# agentops-ai for Claude Code

Use this workflow when asked to audit readiness, review AI-generated changes, or prepare a release.

Rules:

- Prefer `agentops-ai audit`, `agentops-ai review`, and `agentops-ai ship-check` when available.
- Cite exact commands and exit codes.
- Keep verified facts separate from inferred risks.
- Do not print secret values from `.env` files.
- Write reports under `.agentops/reports/`.

Default review stance:

1. Inspect the diff.
2. Run the smallest relevant verification command.
3. Rank findings as confirmed blocker, likely issue, human decision, or suggestion.
4. State known verification gaps.
