// SmaranStack: the root CDK stack for a single environment.
//
// Phases landed:
//   - Phase 1: bootstrap, empty stack, LocalStack
//   - Phase 2: CI/CD workflows (in `.github/workflows/`, not in code)
//   - Phase 3: Cognito user pool + Google OAuth
//   - Phase 3.5: Route 53 subdomain delegation + ACM cert (prod only)
//   - Phase 4: DynamoDB tables
//   - Phase 5: AppSync GraphQL + Lambda resolver dispatcher
//
// Pending:
//   - (none — Phases 6-8 are mobile-side, not infra)
//
// `resourcePrefix` flows into every nested construct so the final
// CloudFormation resource names look like `{prefix}-{construct-id}`
// (e.g. `pr1234-smaran-sandbox-cognito`).
import * as cdk from "aws-cdk-lib/core";
import { Construct } from "constructs";

import { AppSyncConstruct } from "../constructs/appsync";
import { CognitoConstruct } from "../constructs/cognito";
import { DnsConstruct } from "../constructs/dns";
import { DynamoDbConstruct } from "../constructs/dynamodb";
import { EnvCodes } from "../constants";

export interface SmaranStackProps extends cdk.StackProps {
  envCode: EnvCodes;
  /** Stack-name prefix, e.g. `pr1234-smaran-sandbox`. */
  resourcePrefix: string;
  /**
   * Google OAuth 2.0 client ID. Read from CDK context
   * (`-c googleClientId=...`) or the `CDK_CONTEXT_GOOGLE_CLIENT_ID`
   * env var. Required for non-LOCAL envs.
   */
  googleClientId: string;
  /**
   * Google OAuth 2.0 client secret. Read from CDK context
   * (`-c googleClientSecret=...`) or the
   * `CDK_CONTEXT_GOOGLE_CLIENT_SECRET` env var. Required for
   * non-LOCAL envs.
   */
  googleClientSecret: string;
}

export class SmaranStack extends cdk.Stack {
  public readonly cognito: CognitoConstruct;
  public readonly dns: DnsConstruct;
  public readonly dynamodb: DynamoDbConstruct;
  public readonly appsync: AppSyncConstruct;

  constructor(scope: Construct, id: string, props: SmaranStackProps) {
    super(scope, id, props);

    // Tag every resource with the env so cost reports and the AWS
    // console's resource group filters work without extra wiring.
    cdk.Tags.of(this).add("app", "smaran");
    cdk.Tags.of(this).add("env", props.envCode);
    cdk.Tags.of(this).add("resource-prefix", props.resourcePrefix);

    // --- Cognito (Phase 3) ---
    // LOCAL envs use placeholder Google creds; the hosted UI will
    // sign in (against LocalStack's mock) but real Google sign-in is
    // only wired for sandbox/staging/prod.
    const isLocal = props.envCode === EnvCodes.LOCAL;
    this.cognito = new CognitoConstruct(this, "Cognito", {
      envCode: props.envCode,
      resourcePrefix: props.resourcePrefix,
      googleClientId: isLocal
        ? "local-placeholder-client-id"
        : props.googleClientId,
      googleClientSecret: isLocal
        ? "local-placeholder-client-secret"
        : props.googleClientSecret,
    });

    // --- DNS (Phase 3.5) ---
    // Self-skips in non-prod. See lib/constructs/dns.ts.
    this.dns = new DnsConstruct(this, "Dns", {
      envCode: props.envCode,
      resourcePrefix: props.resourcePrefix,
    });

    // --- DynamoDB (Phase 4) ---
    this.dynamodb = new DynamoDbConstruct(this, "DynamoDB", {
      envCode: props.envCode,
      resourcePrefix: props.resourcePrefix,
    });

    // --- AppSync (Phase 5) ---
    this.appsync = new AppSyncConstruct(this, "AppSync", {
      envCode: props.envCode,
      resourcePrefix: props.resourcePrefix,
      userPool: this.cognito.userPool,
      groupsTable: this.dynamodb.groupsTable,
      membershipsTable: this.dynamodb.membershipsTable,
      invitesTable: this.dynamodb.invitesTable,
      listsTable: this.dynamodb.listsTable,
      itemsTable: this.dynamodb.itemsTable,
    });

    // --- Outputs ---
    // The mobile app reads these to know which user pool + client to
    // point at. The CI workflow writes them to a JSON file the
    // mobile app's release process consumes (see
    // `.github/workflows/deploy-*.yaml` for `--outputs-file`).
    new cdk.CfnOutput(this, "UserPoolId", {
      value: this.cognito.userPool.userPoolId,
      description: "Cognito user pool ID",
      exportName: `${props.resourcePrefix}-user-pool-id`,
    });
    new cdk.CfnOutput(this, "UserPoolClientId", {
      value: this.cognito.userPoolClient.userPoolClientId,
      description: "Cognito user pool client ID (the OAuth2.0 client)",
      exportName: `${props.resourcePrefix}-user-pool-client-id`,
    });
    new cdk.CfnOutput(this, "HostedUiDomain", {
      value: this.cognito.userPoolDomain.domainName,
      description: "Cognito hosted UI domain prefix (no protocol, no region)",
      exportName: `${props.resourcePrefix}-hosted-ui-domain`,
    });
    new cdk.CfnOutput(this, "HostedUiUrl", {
      value: this.cognito.hostedUiUrl(),
      description: "Full hosted UI URL the mobile app opens in the browser",
      exportName: `${props.resourcePrefix}-hosted-ui-url`,
    });
    // DynamoDB outputs (Phase 4)
    new cdk.CfnOutput(this, "GroupsTableName", {
      value: this.dynamodb.groupsTable.tableName,
      description: "DynamoDB groups table name",
      exportName: `${props.resourcePrefix}-groups-table-name`,
    });
    new cdk.CfnOutput(this, "MembershipsTableName", {
      value: this.dynamodb.membershipsTable.tableName,
      description: "DynamoDB group memberships table name",
      exportName: `${props.resourcePrefix}-memberships-table-name`,
    });
    new cdk.CfnOutput(this, "InvitesTableName", {
      value: this.dynamodb.invitesTable.tableName,
      description: "DynamoDB invites table name",
      exportName: `${props.resourcePrefix}-invites-table-name`,
    });
    new cdk.CfnOutput(this, "ListsTableName", {
      value: this.dynamodb.listsTable.tableName,
      description: "DynamoDB lists table name",
      exportName: `${props.resourcePrefix}-lists-table-name`,
    });
    new cdk.CfnOutput(this, "ItemsTableName", {
      value: this.dynamodb.itemsTable.tableName,
      description: "DynamoDB list items table name",
      exportName: `${props.resourcePrefix}-items-table-name`,
    });
    // AppSync outputs (Phase 5)
    new cdk.CfnOutput(this, "GraphQLApiId", {
      value: this.appsync.api.apiId,
      description: "AppSync GraphQL API ID",
      exportName: `${props.resourcePrefix}-graphql-api-id`,
    });
    new cdk.CfnOutput(this, "GraphQLEndpoint", {
      value: this.appsync.api.graphqlUrl,
      description: "AppSync GraphQL endpoint URL (REQUIRES id token in Authorization header)",
      exportName: `${props.resourcePrefix}-graphql-endpoint`,
    });
  }
}
