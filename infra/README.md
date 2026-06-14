# smaran infra

AWS CDK infrastructure for [smaran](https://github.com/ayushporwal/smaran) (group list-sharing app).

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

`Infra` account (`126606499529`) hosts the GitHub Actions OIDC role that all deploy jobs assume into.

## Local dev

```bash
nvm use                  # Node 22 (or whatever's pinned in .tool-versions)
docker compose up -d     # LocalStack on :4566
npm run synth:local      # cdklocal synth against LocalStack
npm test                 # jest unit tests
```

## CI/CD

Hand-rolled GitHub Actions under `.github/workflows/`:

| File                    | Trigger                                 | Env      |
| ----------------------- | --------------------------------------- | -------- |
| `ci.yaml`               | PR open / push to PR                    | n/a (no AWS) |
| `deploy-sandbox.yaml`   | PR opened/synchronised/reopened         | sandbox  |
| `destroy-sandbox.yaml`  | PR closed (merged OR closed)            | sandbox  |
| `deploy-staging.yaml`   | push to `main`                          | staging  |
| `deploy-prod.yaml`      | `workflow_dispatch` only (manual gate)  | prod     |

### One-time OIDC setup (per AWS account)

Each of the four accounts needs an OIDC identity provider + role so GitHub Actions can assume into it. To set up the **sandbox** account (repeat for staging, prod, infra):

1. In the AWS console → IAM → Identity providers → Add provider
   - Provider type: OpenID Connect
   - Provider URL: `https://token.actions.githubusercontent.com`
   - Audience: `sts.amazonaws.com`
2. IAM → Roles → Create role → Web identity → pick the OIDC provider
   - Condition: `token.actions.githubusercontent.com:sub` = `repo:ayushporwal/smaran:ref:refs/heads/*` (or `pull_request` for sandbox; tighten per env)
   - Permissions: start with `AdministratorAccess`; tighten in a follow-up PR
   - Role name: `github-actions-smaran-deploy`
3. Copy the role ARN into the matching workflow's `AWS_ROLE_TO_ASSUME` env var.

The workflows assume this role is already in place; the CDK code never creates it (IAM roles that assume other roles are a bootstrapping problem, and we want the trust boundary to live in AWS, not in CDK).

## Phases

| Phase | Status     | What                                       |
| ----- | ---------- | ------------------------------------------ |
| 1     | done       | Bootstrap, empty stack, LocalStack         |
| 2     | done       | CI + sandbox/staging/prod deploy workflows |
| 3     | **current** | Cognito user pool + Google OAuth         |
| 4     | pending    | DynamoDB tables                            |
| 5     | pending    | AppSync + Lambda resolvers                 |
| 6     | pending    | Mobile auth wiring                         |
| 7     | pending    | Mobile data wiring                         |
| 8     | pending    | Cleanup — remove mock data, dead code      |

## Secrets + OAuth

Phase 3 needs a Google OAuth 2.0 client (one-time setup in
[Google Cloud Console](https://console.cloud.google.com/)).
Details in [`docs/google-oauth-setup.md`](docs/google-oauth-setup.md).
The client ID + secret reach CDK via either `-c googleClientId=...`
or `CDK_CONTEXT_GOOGLE_CLIENT_ID` env var.
