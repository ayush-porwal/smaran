# smaran — agent notes

Always use the `gh` CLI for GitHub-related things.

## Layout

Monorepo with two independent npm projects:

- `infra/` — AWS CDK backend (TypeScript). Scripts: `build` (tsc),
  `test` (jest), `synth`. CDK app runs via ts-node (`bin/smaran.ts`),
  so `cdk diff`/`deploy` need no prior build.
- `mobile/` — Expo + Tamagui app. `lint` = `expo lint`; typecheck via
  `tsc --noEmit` (no build/test scripts). See `mobile/AGENTS.md`.

## CI/CD

- Thin caller workflows in `.github/workflows/` (`ci`, `deploy-sandbox`,
  `destroy-sandbox`, `deploy`) delegate to reusable workflows in
  [`ayush-porwal/actions`](https://github.com/ayush-porwal/actions),
  referenced as `ayush-porwal/actions/.github/workflows/<file>.yaml@main`.
- **Both repos must have compatible visibility**: a public repo can't
  call reusable workflows in a private repo. `smaran` and `actions` are
  both public — keep them that way, or reusable-workflow resolution
  fails at startup (0s run, "workflow file issue").
- Never commit secrets to the `actions` repo; it's public and generic.
- Deploy workflows are backend-only. Mobile config (Cognito/AppSync
  wiring) is fetched live from stack outputs by `mobile/scripts/pull-config.mjs`
  — at build time in `build-sandbox-apk.yaml`, and locally via
  `npm run config:pull`. There are no smaran-local composite actions.

## AWS / deploys

- Region `eu-central-1`. Auth is OIDC only — no long-lived keys.
- Workflows assume `arn:aws:iam::126606499529:role/ap-github-actions-cdk`
  (infra account); `cdk deploy` chain-assumes each target account's
  `cdk-hnb659fds-*` bootstrap roles from there. See `docs/HANDOFF-v2.md`.
- Stacks: `pr{N}-smaran-sandbox-eu-central-1` (per PR), `smaran-staging-eu-central-1`,
  `smaran-production-eu-central-1`. Per-PR prefix is set via `CDK_STACK_PREFIX`.
- `staging` and `production` GitHub environments gate deploys with
  required reviewers; `sandbox` is ungated.

## Conventions

- Node `24.x` across CI.
- Don't edit reusable workflow behavior here — change it in the
  `actions` repo.
