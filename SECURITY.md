# Security Policy

`agentops-ai` is local-first and intentionally conservative with side effects.

## Supported Versions

The project is pre-1.0. Security fixes target the latest `main` branch until npm releases begin.

## Reporting a Vulnerability

Please open a private security advisory on GitHub if available, or contact the maintainer directly through the repository owner profile.

Do not include secret values in public issues.

## Security Boundaries

`agentops-ai` should not:

- print secret env values;
- deploy to production;
- run destructive git commands;
- overwrite user-authored project files without explicit handling;
- claim an agent reviewed code unless that review actually ran.

## Safe Report Content

Reports may include:

- command names;
- exit codes;
- truncated stdout/stderr;
- env key names;
- file names and diff stats.

Reports must not include:

- env values;
- tokens;
- private keys;
- credential-bearing URLs.
