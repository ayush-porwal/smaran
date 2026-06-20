#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib/core';

import { Accounts, EnvCodes, Regions, STACK_NAME_PREFIX_BY_ENV } from '../lib/constants';
import { SmaranStack } from '../lib/stacks/smaran-stack';

const app = new cdk.App();

function makeStack(
  envCode: EnvCodes,
  account: string,
  stackNamePrefix: string,
  resourcePrefix: string,
): void {
  const stackId = `${stackNamePrefix}-${Regions.PRIMARY}`;
  new SmaranStack(app, stackId, {
    stackName: stackId,
    env: { account, region: Regions.PRIMARY },
    envCode,
    resourcePrefix,
    description: `smaran (${envCode}) — group list-sharing app backend`,
  });
}

makeStack(
  EnvCodes.PROD,
  Accounts.PROD,
  STACK_NAME_PREFIX_BY_ENV[EnvCodes.PROD],
  STACK_NAME_PREFIX_BY_ENV[EnvCodes.PROD],
);

makeStack(
  EnvCodes.STAGING,
  Accounts.STAGING,
  STACK_NAME_PREFIX_BY_ENV[EnvCodes.STAGING],
  STACK_NAME_PREFIX_BY_ENV[EnvCodes.STAGING],
);

// CDK_STACK_PREFIX must include the trailing dash (e.g. "pr3-").
// Do NOT add another dash here — that produced `pr3--smaran-sandbox-…`
// and broke `cdk diff`/`cdk destroy` from the workflows.
{
  const prPrefix = process.env['CDK_STACK_PREFIX'];
  const sandboxNamePrefix = prPrefix
    ? `${prPrefix}${STACK_NAME_PREFIX_BY_ENV[EnvCodes.SANDBOX]}`
    : STACK_NAME_PREFIX_BY_ENV[EnvCodes.SANDBOX];
  makeStack(EnvCodes.SANDBOX, Accounts.SANDBOX, sandboxNamePrefix, sandboxNamePrefix);
}
