# smaran

A mobile app for sharing lists inside small, trusted groups (3–12 people)
— shared groceries, todos, and the like. Calm, fast, dark-mode-first.

Monorepo (`npm` workspaces + Turborepo): an AWS CDK backend (`infra/`)
and an Expo + Tamagui app (`mobile/`), with shared tooling in `packages/`.
Install dependencies once at the repo root.

## Layout

```
smaran/
├── infra/           AWS CDK backend — Cognito (Google sign-in), DynamoDB,
│                    AppSync GraphQL + Lambda resolver, Route 53
├── mobile/          Expo + Tamagui app (iOS, Android, web)
├── packages/        shared config (`@smaran/eslint-config`)
├── .github/
│   ├── workflows/   CI/CD caller workflows (see workflows/README.md)
│   ├── deploy-envs.json   env → AWS account/stack mapping for build-apk
│   └── BRANCH_PROTECTION.md   how to gate merges on green CI
├── AGENTS.md        notes for coding agents
└── turbo.json       Turborepo task graph
```

Each workspace has its own README where noted below.

## Quick start

```bash
# Once at the repo root (installs all workspaces + Husky pre-commit hook)
npm install

# Mobile app (local placeholder config — see mobile/README.md)
npm run start --workspace=smaran
# or: cd mobile && npm run start

# Infra (LocalStack iteration)
npm run synth:local --workspace=smaran-infra
# first time: cd infra && docker compose up -d

# Lint / format / typecheck / test (whole repo via Turborepo)
npm run lint
npm run format          # write
npm run format:check    # CI uses this
npm run typecheck
npm run test
```

### Run against a deployed backend

From `mobile/`, pull live Cognito/AppSync config from a deployed stack:

```bash
cd mobile
npm run config:pull -- --stack smaran-staging-eu-central-1 --env staging
# writes mobile/config/staging.json; set SMARAN_ENV=staging when starting
```

Sandbox stacks are named `pr{N}-smaran-sandbox-eu-central-1` (one per open PR).

## Tech stack

- **Backend:** AWS CDK (TypeScript), Cognito + Google IdP, DynamoDB
  (`PAY_PER_REQUEST`), AppSync GraphQL, Lambda, Route 53. Region
  `eu-central-1`.
- **Mobile:** Expo SDK 56 (Router, file-based routes), Tamagui,
  Reanimated; Android builds via EAS (`eas.json` profiles per env).

## Environments

| Env          | Account        | Stack name (suffix)              | Deploy trigger                                   |
| ------------ | -------------- | -------------------------------- | ------------------------------------------------ |
| `sandbox`    | `219602461448` | `pr{N}-smaran-sandbox-…`         | PR (after CI passes); destroyed on PR close      |
| `staging`    | `139316820779` | `smaran-staging-eu-central-1`    | push to `main` (GitHub environment gate)         |
| `production` | `916657620124` | `smaran-production-eu-central-1` | push to `main`, after staging (environment gate) |

The **infra** account (`126606499529`) holds the only GitHub OIDC trust.
Workflows assume `ap-github-actions-cdk` there; CDK chain-assumes each
target account's `cdk-hnb659fds-*` bootstrap roles. Details in
[`infra/README.md`](infra/README.md).

## CI/CD

Thin caller workflows in [`.github/workflows/`](.github/workflows/README.md)
delegate to reusable workflows in
[`ayush-porwal/actions`](https://github.com/ayush-porwal/actions). Callers
pass monorepo paths (`install-directory: .`, `working-directory: infra`,
`lockfile-path: package-lock.json`, `npm-workspace: smaran-infra`).

| Trigger        | Workflow               | What happens                                                                      |
| -------------- | ---------------------- | --------------------------------------------------------------------------------- |
| PR → `main`    | `ci.yaml`              | Path-filtered format + infra/mobile checks; sandbox diff+deploy if infra changed  |
| PR closed      | `destroy-sandbox.yaml` | Tear down `pr{N}` sandbox stack                                                   |
| Push to `main` | `deploy.yaml`          | Staging diff → deploy → prod diff → deploy (requires PR CI via branch protection) |
| Manual         | `build-apk.yaml`       | Fetch stack outputs → EAS Android APK (`sandbox` / `staging` / `production`)      |

**Branch protection:** enable required status checks on `main` before relying
on the deploy pipeline — see [`.github/BRANCH_PROTECTION.md`](.github/BRANCH_PROTECTION.md).

Workflow refs currently pin `@feature/actions-improvements` until that
[actions PR](https://github.com/ayush-porwal/actions/pull/1) merges; then
pin to `@main` or a release tag.

## Docs

- [`infra/README.md`](infra/README.md) — backend layout, local dev, OIDC bootstrap
- [`mobile/README.md`](mobile/README.md) — app dev, config, EAS builds
- [`.github/workflows/README.md`](.github/workflows/README.md) — workflow reference
- [`AGENTS.md`](AGENTS.md) — agent / contributor conventions
