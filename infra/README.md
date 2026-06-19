# smaran infra

AWS CDK infrastructure for [smaran](https://github.com/ayush-porwal/smaran) (group list-sharing app).

## Layout

```
infra/
├── bin/                     CDK app entrypoints
│   ├── smaran.ts            real-AWS deploys (prod, staging, sandbox + optional PR prefix)
│   └── local.ts             LocalStack-only iteration target
├── lib/                     CDK constructs and stacks
│   ├── constants.ts         EnvCodes, Accounts, Regions, retention policy, OAuth callbacks
│   └── stacks/
│       └── smaran-stack.ts  the root stack (empty in Phase 1)
├── test/                    Jest unit tests
├── docker-compose.yml       LocalStack
├── cdk.json                 CDK app config
└── tsconfig.json
```

## Envs

| Env        | Account ID      | Region       | Retention | Deploy trigger                  |
| ---------- | --------------- | ------------ | --------- | ------------------------------- |
| `local`    | `000000000000`  | `eu-central-1` | n/a (LocalStack) | developer machine via `docker compose` + `npm run synth:local` |
| `sandbox`  | `219602461448`  | `eu-central-1` | `DESTROY` | every PR (`pr{N}-smaran-sandbox-…`); destroyed on PR close |
| `staging`  | `139316820779`  | `eu-central-1` | `DESTROY` | push to `main`                  |
| `prod`     | `916657620124`  | `eu-central-1` | `RETAIN`  | `workflow_dispatch` only (manual gate) |

`Infra` account (`126606499529`) hosts the **only** GitHub OIDC trust. Workflows assume `126606499529:ap-github-actions-cdk` once (hop 1, OIDC); `cdk deploy` then chain-assumes `cdk-hnb659fds-deploy-role-*` in each target account (hop 2, done by CDK itself). See [`docs/HANDOFF-v2.md` §4](../docs/HANDOFF-v2.md#4-migration-steps) for the full setup.

## Local dev

```bash
nvm use                  # Node 22 (or whatever's pinned in .tool-versions)
docker compose up -d     # LocalStack on :4566
npm run synth:local      # cdklocal synth against LocalStack
npm test                 # jest unit tests
```

## CI/CD

Thin caller workflows under `.github/workflows/` delegate to reusable
workflows in [`ayush-porwal/actions`](https://github.com/ayush-porwal/actions):

| File                     | Trigger                                | Env      |
| ------------------------ | -------------------------------------- | -------- |
| `ci.yaml`                | PR open / synchronise                  | n/a (no AWS) |
| `deploy-sandbox.yaml`    | PR opened/synchronised/reopened        | sandbox  |
| `destroy-sandbox.yaml`   | PR closed (merged or not)              | sandbox  |
| `deploy.yaml`            | push to `main` (staging → prod)        | staging, production |
| `build-apk.yaml`         | `workflow_dispatch` (env + PR number)  | sandbox / staging / production |

The deploy workflows are backend-only. Mobile config (Cognito/AppSync
wiring) is fetched live from the deployed stack's CloudFormation outputs
by `mobile/scripts/pull-config.mjs` — at build time in `build-apk`,
and on demand locally via `npm run config:pull` (in `mobile/`). There are
no longer any smaran-local composite actions under `.github/actions/`.

### One-time OIDC + bootstrap setup

Full step-by-step in [`docs/HANDOFF-v2.md` §4](../docs/HANDOFF-v2.md#4-migration-steps). Short version:

1. **Infra account** (`126606499529`): create the GitHub OIDC provider + one role (`ap-github-actions-cdk`) whose inline policy allows `sts:AssumeRole` on `role/cdk-*` in each target account.
2. **Each target account** (`219602461448`, `139316820779`, `916657620124`): run `cdk bootstrap aws://<account>/eu-central-1 --trust 126606499529 --trust-for-lookup 126606499529 --cloudformation-execution-policies arn:aws:iam::aws:policy/AdministratorAccess`. This creates the `cdk-hnb659fds-{deploy,file-publishing,image-publishing,lookup,cfn-exec}-role-*` roles with the org's standard separation-of-duties split.

The CDK code does not create IAM roles — the trust boundary lives in AWS, set up by `cdk bootstrap`.

## Phases

| Phase | Status     | What                                       |
| ----- | ---------- | ------------------------------------------ |
| 1     | done       | Bootstrap, empty stack, LocalStack         |
| 2     | done       | CI + sandbox/staging/prod deploy workflows |
| 3     | done       | Cognito user pool + Google OAuth           |
| 4     | done       | DynamoDB tables                            |
| 5     | done       | AppSync + Lambda resolvers                 |
| 6     | done       | Mobile auth wiring                         |
| 7     | done       | Mobile data wiring                         |
| 8     | done       | Cleanup — remove mock data, dead code      |

## Secrets + OAuth

Cognito Google sign-in needs an OAuth 2.0 client per env. Full setup in [`infra/docs/google-oauth-setup.md`](docs/google-oauth-setup.md). The client ID + secret are stored in AWS Secrets Manager (`smaran/{env}/google-oauth`, one secret per env account) and CDK reads them at deploy time via a CloudFormation dynamic reference — they never enter the template, so they're not in `cdk diff` output.
