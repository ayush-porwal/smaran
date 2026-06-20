# smaran mobile

Expo + Tamagui client for [smaran](https://github.com/ayush-porwal/smaran) — shared lists inside small groups.

Part of the **npm-workspace monorepo**: install from the repo root, then use
`--workspace=smaran` or run scripts from this directory after a root install.

## Prerequisites

- Node **24.x** (matches CI)
- [Expo dev client](https://docs.expo.dev/develop/development-builds/introduction/) on a device or simulator (this app does not target Expo Go for production features)
- For a real backend: a deployed stack + pulled config (below)

## Get started

```bash
# From repo root
npm install
npm run start --workspace=smaran

# Or from mobile/
cd mobile
npm run start          # expo start --dev-client
npm run android        # native run on Android
npm run ios            # native run on iOS
```

Local development uses `mobile/config/local.json` (placeholder Cognito/AppSync
values). The active file is selected by `SMARAN_ENV` (see `src/lib/config.ts`).

## Backend config

Runtime config is **not** committed for deployed envs. Pull it from a live
CloudFormation stack:

```bash
cd mobile
npm run config:pull -- --stack smaran-staging-eu-central-1 --env staging
# → writes config/staging.json

# Per-PR sandbox (while PR is open):
npm run config:pull -- --stack pr4-smaran-sandbox-eu-central-1 --env sandbox
```

Then start with the matching env:

```bash
SMARAN_ENV=staging npm run start
```

| `SMARAN_ENV` | Config file           | Typical stack                       |
| ------------ | --------------------- | ----------------------------------- |
| `local`      | `config/local.json`   | n/a (LocalStack / placeholder)      |
| `sandbox`    | `config/sandbox.json` | `pr{N}-smaran-sandbox-eu-central-1` |
| `staging`    | `config/staging.json` | `smaran-staging-eu-central-1`       |
| `prod`       | `config/prod.json`    | `smaran-production-eu-central-1`    |

CI uses the same script in `build-apk.yaml`; env → stack mapping is in
[`.github/deploy-envs.json`](../.github/deploy-envs.json).

## Project layout

```
mobile/
├── src/
│   ├── app/              Expo Router routes (file-based)
│   ├── components/       feature UI (modals, lists, …)
│   ├── design-system/    Tamagui primitives, tokens, theme
│   └── lib/              auth, GraphQL client, config loader
├── config/               env JSON (local committed; others gitignored / CI-generated)
├── scripts/
│   └── pull-config.mjs   fetch Cognito/AppSync outputs from AWS
├── eas.json              EAS build profiles (local, sandbox, staging, production)
└── app.config.ts         Expo config
```

See [`AGENTS.md`](AGENTS.md) for Expo SDK 56 doc links and conventions.

## Quality checks

From repo root (preferred — matches CI):

```bash
npm run lint --workspace=smaran
npm run typecheck --workspace=smaran
npm run format:check    # whole repo
```

Pre-commit hooks (Husky + lint-staged) format and lint staged files.

## EAS builds (Android APK)

APKs are built **on demand** in GitHub Actions (`build-apk` workflow) to stay
within EAS free-tier limits — not on every deploy.

1. Actions → **build-apk** → Run workflow
2. Choose `environment` (`sandbox` / `staging` / `production`)
3. For sandbox, provide the open **PR number**
4. Collect the build from [expo.dev → Builds](https://expo.dev) when finished
   (workflow uses `--no-wait`)

Local EAS (requires `EXPO_TOKEN`):

```bash
cd mobile
eas build --platform android --profile staging --non-interactive
```

Monorepo note: CI sets `EAS_PROJECT_ROOT` to the repo root so workspace deps
resolve from the root lockfile; `.easignore` keeps uploads lean.

## Learn more

- [Expo SDK 56 docs](https://docs.expo.dev/versions/v56.0.0/)
- [Expo Router](https://docs.expo.dev/router/introduction/)
- [Tamagui](https://tamagui.dev/)
