#!/usr/bin/env node
// CDK app entrypoint for real-AWS deploys. Synthesises one stack
// per env. PR sandboxes add a `pr{N}-` prefix to the stack name
// and the resource prefix (so concurrent PRs don't trample each
// other); on PR close the matching workflow destroys the stack.
//
// Env matrix:
//   - prod, staging, sandbox (with optional PR prefix): synthesised here
//   - local: handled by bin/local.ts (LocalStack, no AWS account)
//
// The GitHub Actions workflow injects the PR number via
// `CDK_STACK_PREFIX`. When that's unset, the sandbox stack is just
// `smaran-sandbox-eu-central-1` — useful for one-off dev deploys.
import * as cdk from "aws-cdk-lib/core";

import {
  Accounts,
  EnvCodes,
  Regions,
  STACK_NAME_PREFIX_BY_ENV,
} from "../lib/constants";
import { SmaranStack } from "../lib/stacks/smaran-stack";

const app = new cdk.App();

/**
 * Resolve the Google OAuth 2.0 client ID + secret for a non-LOCAL
 * stack. Order:
 *   1. CDK context: `-c googleClientId=... -c googleClientSecret=...`
 *   2. Environment: `CDK_CONTEXT_GOOGLE_CLIENT_ID`,
 *      `CDK_CONTEXT_GOOGLE_CLIENT_SECRET`
 *   3. Throws — sandbox/staging/prod must never deploy with a
 *      placeholder. Local has its own dummy values baked into the
 *      stack so it's not affected.
 */
function resolveGoogleCreds(): { clientId: string; clientSecret: string } {
  const clientId = app.node.tryGetContext("googleClientId") ?? process.env["CDK_CONTEXT_GOOGLE_CLIENT_ID"];
  const clientSecret =
    app.node.tryGetContext("googleClientSecret") ?? process.env["CDK_CONTEXT_GOOGLE_CLIENT_SECRET"];
  if (!clientId || !clientSecret) {
    throw new Error(
      "Google OAuth credentials are required for sandbox/staging/prod.\n" +
        "  Pass via -c googleClientId=... -c googleClientSecret=...\n" +
        "  or set CDK_CONTEXT_GOOGLE_CLIENT_ID / CDK_CONTEXT_GOOGLE_CLIENT_SECRET env vars.",
    );
  }
  return { clientId, clientSecret };
}

function makeStack(
  envCode: EnvCodes,
  account: string,
  stackNamePrefix: string,
  resourcePrefix: string,
  googleClientId: string,
  googleClientSecret: string,
): void {
  const stackId = `${stackNamePrefix}-${Regions.PRIMARY}`;
  new SmaranStack(app, stackId, {
    stackName: stackId,
    env: { account, region: Regions.PRIMARY },
    envCode,
    resourcePrefix,
    googleClientId,
    googleClientSecret,
    description: `smaran (${envCode}) — group list-sharing app backend`,
  });
}

// --- prod (no PR prefix) ---
{
  const { clientId, clientSecret } = resolveGoogleCreds();
  makeStack(
    EnvCodes.PROD,
    Accounts.PROD,
    STACK_NAME_PREFIX_BY_ENV[EnvCodes.PROD],
    STACK_NAME_PREFIX_BY_ENV[EnvCodes.PROD],
    clientId,
    clientSecret,
  );
}

// --- staging (no PR prefix) ---
{
  const { clientId, clientSecret } = resolveGoogleCreds();
  makeStack(
    EnvCodes.STAGING,
    Accounts.STAGING,
    STACK_NAME_PREFIX_BY_ENV[EnvCodes.STAGING],
    STACK_NAME_PREFIX_BY_ENV[EnvCodes.STAGING],
    clientId,
    clientSecret,
  );
}

// --- sandbox (optionally PR-prefixed) ---
{
  const { clientId, clientSecret } = resolveGoogleCreds();
  const prPrefix = process.env["CDK_STACK_PREFIX"];
  const sandboxNamePrefix = prPrefix
    ? `${prPrefix}-${STACK_NAME_PREFIX_BY_ENV[EnvCodes.SANDBOX]}`
    : STACK_NAME_PREFIX_BY_ENV[EnvCodes.SANDBOX];
  makeStack(EnvCodes.SANDBOX, Accounts.SANDBOX, sandboxNamePrefix, sandboxNamePrefix, clientId, clientSecret);
}
