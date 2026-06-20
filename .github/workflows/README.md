# GitHub Actions workflows

Thin **caller** workflows for smaran. Behavior is implemented in reusable
workflows in [`ayush-porwal/actions`](https://github.com/ayush-porwal/actions);
callers pass smaran-specific paths, stack names, and AWS settings.

## Monorepo install pattern

All Node/CDK jobs use the same caller inputs:

```yaml
install-directory: .
working-directory: infra # or mobile for EAS
lockfile-path: package-lock.json
npm-workspace: smaran-infra # or smaran for mobile checks
```

Reusable workflows stay layout-agnostic — another repo can pass different paths
without changing `actions`.

**Ref pin:** workflows currently use `@feature/actions-improvements`. After
[actions PR #1](https://github.com/ayush-porwal/actions/pull/1) merges, update
refs to `@main` or a release tag.

## Workflows

### `ci.yaml`

**Triggers:** pull request → `main`, `workflow_dispatch`

**Jobs:**

| Job                                | When                                           | What                                               |
| ---------------------------------- | ---------------------------------------------- | -------------------------------------------------- |
| `detect path changes`              | always                                         | `dorny/paths-filter` — skip unrelated package work |
| `format check`                     | always                                         | `npm run format:check` at repo root                |
| `infra — lint, build, test, synth` | infra or shared paths changed                  | Reusable `nodejs-cdk-ci`                           |
| `mobile — typecheck, lint`         | mobile or shared paths changed                 | Reusable `nodejs-ci`                               |
| `sandbox — diff + deploy`          | PR + infra changed + all required checks green | Reusable `nodejs-cdk-diff-deploy`                  |

Sandbox deploy runs **inside** this workflow (not a separate file) and only
after format + infra (+ mobile when it ran) succeed. No sandbox deploy on
`workflow_dispatch` (no PR number).

**Concurrency:** one run per PR head ref; cancel in-progress.

### `destroy-sandbox.yaml`

**Triggers:** pull request closed (merged or not)

Destroys `pr{N}-smaran-sandbox-eu-central-1` via reusable `nodejs-cdk-destroy`.

### `deploy.yaml`

**Triggers:** push to `main`, `workflow_dispatch`

**Chain:** (optional CI on manual) → staging diff → staging deploy → prod diff → prod deploy

- Push to `main` assumes PR CI already passed — enforce with
  [branch protection](../BRANCH_PROTECTION.md).
- `staging` and `production` GitHub **environments** gate deploy jobs (required reviewers).
- Diff jobs are ungated so reviewers read the plan before approving deploy.

### `build-apk.yaml`

**Triggers:** `workflow_dispatch` only

1. **fetch config** — reads [deploy-envs.json](../deploy-envs.json), assumes AWS OIDC + target lookup role, runs `mobile/scripts/pull-config.mjs`, uploads config artifact.
2. **EAS build** — reusable `eas-build` with monorepo `eas-project-root`, downloads config artifact.

Inputs: `environment` (`sandbox` | `staging` | `production`), `pr_number` (required for sandbox).

## Related files

| File                                            | Purpose                                              |
| ----------------------------------------------- | ---------------------------------------------------- |
| [deploy-envs.json](../deploy-envs.json)         | Account ID, stack name template, EAS profile per env |
| [BRANCH_PROTECTION.md](../BRANCH_PROTECTION.md) | Required status checks for `main`                    |

## Permissions

| Workflow               | `contents` | `id-token`             |
| ---------------------- | ---------- | ---------------------- |
| `ci.yaml`              | read       | write (sandbox deploy) |
| `destroy-sandbox.yaml` | read       | write                  |
| `deploy.yaml`          | read       | write                  |
| `build-apk.yaml`       | read       | write                  |

## Secrets

| Secret       | Used by                       |
| ------------ | ----------------------------- |
| `EXPO_TOKEN` | `build-apk.yaml` (EAS submit) |

AWS uses OIDC only — no long-lived access keys in the repo.
