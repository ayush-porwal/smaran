#!/usr/bin/env node
// CDK app entrypoint for LocalStack. Synthesises a single
// `smaran-local-eu-central-1` stack against the LocalStack dummy
// account (`000000000000`) so you can iterate on infra without
// AWS credentials. Pairs with `docker-compose.yml`:
//
//   docker compose up -d
//   npm run synth:local
//
// Cognito / AppSync in LocalStack is partial — Phase 1 only spins
// up the empty stack. The point of having a separate bin entrypoint
// is to keep `bin/smaran.ts` clean of LocalStack-only concerns.
import * as cdk from "aws-cdk-lib/core";

import {
  Accounts,
  EnvCodes,
  Regions,
  STACK_NAME_PREFIX_BY_ENV,
} from "../lib/constants";
import { SmaranStack } from "../lib/stacks/smaran-stack";

const app = new cdk.App();

const stackId = `${STACK_NAME_PREFIX_BY_ENV[EnvCodes.LOCAL]}-${Regions.PRIMARY}`;

new SmaranStack(app, stackId, {
  stackName: stackId,
  env: { account: Accounts.LOCAL, region: Regions.PRIMARY },
  envCode: EnvCodes.LOCAL,
  resourcePrefix: STACK_NAME_PREFIX_BY_ENV[EnvCodes.LOCAL],
  description: "smaran (local) — LocalStack-only iteration target",
});
