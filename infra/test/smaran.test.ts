// Placeholder smoke test — Phase 1 only asserts that the empty
// SmaranStack synthesises without throwing. Real assertions (resource
// counts, IAM policy shape, retention policy on each resource, etc.)
// land alongside the constructs in later phases.
import * as cdk from "aws-cdk-lib/core";
import { Template } from "aws-cdk-lib/assertions";

import { EnvCodes, Regions, STACK_NAME_PREFIX_BY_ENV } from "../lib/constants";
import { SmaranStack } from "../lib/stacks/smaran-stack";

describe("SmaranStack", () => {
  it("synthesises a stack with Cognito (Phase 3) and DynamoDB (Phase 4)", () => {
    const app = new cdk.App();
    const stack = new SmaranStack(app, "test-stack", {
      env: { account: "111111111111", region: Regions.PRIMARY },
      envCode: EnvCodes.SANDBOX,
      resourcePrefix: STACK_NAME_PREFIX_BY_ENV[EnvCodes.SANDBOX],
      googleClientId: "test-client-id",
      googleClientSecret: "test-client-secret",
    });
    const template = Template.fromStack(stack);

    // Cognito (Phase 3)
    template.resourceCountIs("AWS::Cognito::UserPool", 1);
    template.resourceCountIs("AWS::Cognito::UserPoolClient", 1);
    template.resourceCountIs("AWS::Cognito::UserPoolDomain", 1);

    // DynamoDB (Phase 4)
    template.resourceCountIs("AWS::DynamoDB::Table", 5);

    // AppSync (Phase 5)
    template.resourceCountIs("AWS::AppSync::GraphQLApi", 1);
    template.resourceCountIs("AWS::Lambda::Function", 1);
  });
});
