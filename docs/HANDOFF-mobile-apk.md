# Handoff — Sandbox APK builds

Goal: build an installable Android APK pointed at a deployed sandbox
backend (e.g. `pr4-smaran-sandbox-eu-central-1`) so it can be tested on a
real phone.

## How it works (after the refactor)

Deploy workflows are **backend-only**. The mobile build owns its own
config: `mobile/scripts/pull-config.mjs` reads a deployed stack's
CloudFormation outputs (`UserPoolId`, `UserPoolClientId`, `HostedUiDomain`,
`GraphQLEndpoint`) and writes `mobile/config/{env}.json`. These values are
**public** (they ship in the APK anyway), so fetching them in CI is fine.

- **CI:** `build-sandbox-apk.yaml` (`workflow_dispatch`, input = PR number)
  → OIDC → `pull-config.mjs` writes `config/sandbox.json` → `eas-build`
  reusable with `profile: sandbox`. On-demand, to stay within EAS free-tier
  build limits.
- **Local:** `cd mobile && npm run config:pull -- --stack <stack> --env sandbox --out local.json`
  points `expo start` at a real sandbox backend.
- `app.config.ts` loads `config/{SMARAN_ENV}.json`; the `sandbox` eas.json
  profile sets `SMARAN_ENV=sandbox` and `distribution: internal` (installable
  APK via link/QR, no Play Store).

## What's done

- `app.json`: `owner` + `extra.eas.projectId` set (EAS project linked).
- `EXPO_TOKEN` repo secret added.
- `eas.json`: `local` / `sandbox` / `staging` / `production` profiles.
- Deploy chain decoupled: `write-mobile-config` action deleted; mobile
  jobs/artifacts removed from `deploy.yaml` and `deploy-sandbox.yaml`.
- `eas-build.yaml`: dropped the invalid `eas build --env` flag (env comes
  from the profile).
- `build-sandbox-apk.yaml` + `mobile/scripts/pull-config.mjs` +
  `npm run config:pull` added.

## What's left for you

1. **Point local at the sandbox** (needs your AWS creds for the sandbox
   account): `cd mobile && npm run config:pull -- --stack pr4-smaran-sandbox-eu-central-1 --env sandbox --out local.json`.
   Re-run whenever the sandbox redeploys (per-PR sandboxes are ephemeral).
2. **Google OAuth** for the shared client (local/staging/sandbox): authorised
   redirect URIs are the Cognito `…/oauth2/idpresponse` endpoints. Local
   reuses the sandbox hosted UI, so no separate local entry is needed. See
   `infra/docs/google-oauth-setup.md`.

## How you test

1. Push this branch so `build-sandbox-apk.yaml` exists on the repo, then run
   it (Actions → build-sandbox-apk) with PR number `4`.
2. Open the EAS install link / scan the QR on Android → install past Play
   Protect → log in against the sandbox backend.

## Notes / known issues

- Concurrent PR sandboxes currently **share the Cognito hosted-UI domain**
  (`smaran-sandbox`). Fine for one sandbox; fix before running several at once.
- To build staging/prod APKs too, generalise `build-sandbox-apk.yaml` (env
  input → stack name + profile); the `pull-config.mjs` script already
  supports any stack/env.
