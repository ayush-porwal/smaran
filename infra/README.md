# smaran infra

AWS CDK infrastructure for [smaran](https://github.com/ayush-porwal/smaran) — Cognito, DynamoDB, AppSync + Lambda, Route 53.

Part of the **npm-workspace monorepo**: install from the repo root (`npm install`), then run scripts via `--workspace=smaran-infra` or from this directory after a root install.

## Layout

```
infra/
├── bin/
│   ├── smaran.ts            real-AWS deploys (prod, staging, sandbox + optional PR prefix)
│   └── local.ts             LocalStack-only iteration target
├── lib/
│   ├── constants.ts         EnvCodes, Accounts, Regions, retention, OAuth callbacks
│   ├── constructs/          Cognito, DynamoDB, AppSync, DNS, …
│   ├── lambda/              AppSync resolver handler
│   └── stacks/
│       └── smaran-stack.ts  root stack wiring all constructs
├── test/                    Jest unit tests
├── docker-compose.yml       LocalStack
├── cdk.json
└── package.json             workspace name: smaran-infra
```

## Environments

| Env       | Account ID     | Region         | Retention | Deploy trigger                                                 |
| --------- | -------------- | -------------- | --------- | -------------------------------------------------------------- |
| `local`   | `000000000000` | `eu-central-1` | n/a       | developer machine — LocalStack + `npm run synth:local`         |
| `sandbox` | `219602461448` | `eu-central-1` | `DESTROY` | PR (`pr{N}-smaran-sandbox-…`), after CI; destroyed on PR close |
| `staging` | `139316820779` | `eu-central-1` | `DESTROY` | push to `main` (GitHub `staging` environment)                  |
| `prod`    | `916657620124` | `eu-central-1` | `RETAIN`  | push to `main`, after staging (`production` environment)       |

The **infra** account (`126606499529`) hosts the only GitHub OIDC trust.
Workflows assume `arn:aws:iam::126606499529:role/ap-github-actions-cdk`
(hop 1); `cdk deploy` chain-assumes `cdk-hnb659fds-deploy-role-*` in each
target account (hop 2, handled by CDK).

Per-PR sandboxes set `CDK_STACK_PREFIX=pr{N}-` in CI so stack names match
`pr{N}-smaran-sandbox-eu-central-1`.

## Local dev

Requires Node **24.x** (matches CI) and Docker for LocalStack.

```bash
# From repo root (recommended)
npm install
npm run synth:local --workspace=smaran-infra

# Or from infra/ after a root install
cd infra
docker compose up -d     # LocalStack on :4566
npm run synth:local
npm test
npm run lint
```

Other useful scripts (root or `--workspace=smaran-infra`):

```bash
npm run build --workspace=smaran-infra    # tsc
npm run synth --workspace=smaran-infra      # cdk synth (needs dummy AWS creds or real profile)
```

## CI/CD

Caller workflows live in [`.github/workflows/`](../.github/workflows/README.md)
and delegate to [`ayush-porwal/actions`](https://github.com/ayush-porwal/actions).
Smaran-specific values (stack names, AWS role ARN, monorepo paths) are passed
**from the caller** — the reusable workflows stay layout-agnostic.

| Workflow               | Trigger                 | Infra effect                                                          |
| ---------------------- | ----------------------- | --------------------------------------------------------------------- |
| `ci.yaml`              | PR / manual             | lint, build, test, synth; sandbox diff+deploy when infra paths change |
| `destroy-sandbox.yaml` | PR closed               | `cdk destroy` per-PR sandbox                                          |
| `deploy.yaml`          | push to `main` / manual | staging → production promote chain                                    |
| `build-apk.yaml`       | manual                  | reads stack outputs (not a CDK deploy)                                |

Deploy workflows are **backend-only**. Mobile Cognito/AppSync wiring is
written by `mobile/scripts/pull-config.mjs` from CloudFormation outputs —
locally via `npm run config:pull --workspace=smaran`, in CI via
`build-apk.yaml`. Env → account/stack mapping for APK builds is in
[`.github/deploy-envs.json`](../.github/deploy-envs.json).

Merges to `main` should require green PR CI — see
[`.github/BRANCH_PROTECTION.md`](../.github/BRANCH_PROTECTION.md).

### One-time OIDC + bootstrap setup

1. **Infra account** (`126606499529`): GitHub OIDC provider + role
   `ap-github-actions-cdk` whose policy allows `sts:AssumeRole` on
   `role/cdk-*` in each target account.
2. **Each target account**: `cdk bootstrap aws://<account>/eu-central-1 \
--trust 126606499529 --trust-for-lookup 126606499529 \
--cloudformation-execution-policies arn:aws:iam::aws:policy/AdministratorAccess`

The CDK app does not create IAM roles — the trust boundary is established by
`cdk bootstrap` in each account.

## Secrets + OAuth

Google sign-in uses an OAuth 2.0 client **per environment**. Store
`{ clientId, clientSecret }` in Secrets Manager as
`smaran/{env}/google-oauth` (one secret per env account). CDK reads them at
deploy time via a CloudFormation dynamic reference — they are not in the
synthesized template or `cdk diff` output.

Create the Google Cloud OAuth clients in the [Google Cloud Console](https://console.cloud.google.com/apis/credentials) with redirect URIs matching the Cognito hosted UI domain for each env (see `lib/constants.ts` for callback URL patterns).

## Implementation status

All planned backend phases are complete: bootstrap, CI/CD, Cognito + Google
OAuth, DynamoDB, AppSync + Lambda resolvers, and production DNS (Route 53
delegation for prod). Mobile auth and data wiring live in `mobile/`.
