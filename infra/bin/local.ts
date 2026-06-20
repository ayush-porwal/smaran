#!/usr/bin/env node
// LocalStack entrypoint: synthesises `smaran-local-eu-central-1` against
// the dummy account so infra can be iterated without AWS credentials.
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
