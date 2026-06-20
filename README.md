# smaran

A mobile app for sharing lists inside small, trusted groups (3–12 people)
— shared groceries, todos, and the like. Calm, fast, dark-mode-first.

> Monorepo (`npm` workspaces + Turborepo): an AWS CDK backend (`infra/`)
> and an Expo + Tamagui app (`mobile/`), wired together by GitHub Actions
> CI/CD. Install dependencies once at the repo root.

## Layout

```
smaran/
├── infra/        AWS CDK backend — Cognito (Google sign-in), DynamoDB,
│                 AppSync GraphQL + Lambda resolver, Route 53
├── mobile/       Expo + Tamagui app (iOS, Android, web)
├── packages/     shared tooling (`@smaran/eslint-config`)
├── docs/         design spec + setup/handoff guides
└── .github/      CI/CD caller workflows + a local composite action
```

Each of `infra/` and `mobile/` is an npm workspace with its own README.

## Quick start

```bash
# Once at the repo root (installs all workspaces + git hooks)
npm install

# Mobile app (against the local placeholder config)
npm run start --workspace=smaran    # or: cd mobile && npx expo start

# Infra (LocalStack iteration)
npm run synth:local --workspace=smaran-infra
# first time: cd infra && docker compose up -d

# Lint / format / typecheck (whole repo)
npm run lint
npm run format
npm run typecheck
```

To run the app against a real backend, point `SMARAN_ENV` at a deployed
env — full walkthrough in [`docs/HANDOFF.md`](docs/HANDOFF.md).

## Tech stack

- **Backend:** AWS CDK (TypeScript), Cognito + Google IdP, DynamoDB
  (`PAY_PER_REQUEST`), AppSync GraphQL, Lambda, Route 53. Region
  `eu-central-1`.
- **Mobile:** Expo (Router, file-based), Tamagui, Reanimated; builds via
  EAS. See [`docs/design-spec.md`](docs/design-spec.md) for the visual and
  interaction language.

## Environments

| Env          | Account        | Region         | Deploy trigger                                           |
| ------------ | -------------- | -------------- | -------------------------------------------------------- |
| `sandbox`    | `219602461448` | `eu-central-1` | per PR (`pr{N}-smaran-sandbox-…`), torn down on PR close |
| `staging`    | `139316820779` | `eu-central-1` | push to `main` (gated)                                   |
| `production` | `916657620124` | `eu-central-1` | push to `main`, after staging (gated)                    |

AWS auth is OIDC-only (no long-lived keys): workflows assume the infra
account's `ap-github-actions-cdk` role, and `cdk deploy` chain-assumes
each target account's bootstrap roles. See
[`docs/HANDOFF-v2.md`](docs/HANDOFF-v2.md).

## CI/CD

Caller workflows in [`.github/workflows/`](.github/workflows/README.md):

- **PR** → monorepo lint/typecheck + infra build/test/synth (`ci`) + an
  ephemeral `pr{N}` sandbox (`deploy-sandbox`)
- **PR close** → sandbox teardown (`destroy-sandbox`)
- **merge to `main`** → staging → production (`deploy`)
- **on demand** → Android APK for any env (`build-apk`, `workflow_dispatch`)

Deploy workflows still delegate to reusable workflows in
[`ayush-porwal/actions`](https://github.com/ayush-porwal/actions).

## Docs

- [`docs/design-spec.md`](docs/design-spec.md) — visual + interaction language
- [`docs/HANDOFF.md`](docs/HANDOFF.md) — run the app, deploy, build an APK end-to-end
- [`docs/HANDOFF-v2.md`](docs/HANDOFF-v2.md) — the IAM / OIDC deploy model
- [`infra/README.md`](infra/README.md) — backend layout + local dev
- [`.github/workflows/README.md`](.github/workflows/README.md) — CI/CD detail
