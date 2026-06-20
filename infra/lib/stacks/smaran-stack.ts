import * as cdk from "aws-cdk-lib/core";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import { Construct } from "constructs";

import { AppSyncConstruct } from "../constructs/appsync";
import { CognitoConstruct } from "../constructs/cognito";
import { DnsConstruct } from "../constructs/dns";
import { DynamoDbConstruct } from "../constructs/dynamodb";
import { EnvCodes, googleOAuthSecretName, Regions } from "../constants";

export interface SmaranStackProps extends cdk.StackProps {
  envCode: EnvCodes;
  /** Stack-name prefix, e.g. `pr1234-smaran-sandbox`. */
  resourcePrefix: string;
}

export class SmaranStack extends cdk.Stack {
  public readonly cognito: CognitoConstruct;
  public readonly dns: DnsConstruct;
  public readonly dynamodb: DynamoDbConstruct;
  public readonly appsync: AppSyncConstruct;

  constructor(scope: Construct, id: string, props: SmaranStackProps) {
    super(scope, id, props);

    cdk.Tags.of(this).add("app", "smaran");
    cdk.Tags.of(this).add("env", props.envCode);
    cdk.Tags.of(this).add("resource-prefix", props.resourcePrefix);

    // LOCAL creates a placeholder secret in LocalStack; other envs
    // reference the manually-created `smaran/{env}/google-oauth` secret.
    const isLocal = props.envCode === EnvCodes.LOCAL;
    const googleOAuthSecret: secretsmanager.ISecret = isLocal
      ? new secretsmanager.Secret(this, "GoogleOAuthSecret", {
          secretName: googleOAuthSecretName(props.envCode),
          secretStringValue: cdk.SecretValue.unsafePlainText(
            JSON.stringify({
              clientId: "local-placeholder-client-id",
              clientSecret: "local-placeholder-client-secret",
            }),
          ),
        })
      : secretsmanager.Secret.fromSecretNameV2(
          this,
          "GoogleOAuthSecret",
          googleOAuthSecretName(props.envCode),
        );

    this.cognito = new CognitoConstruct(this, "Cognito", {
      envCode: props.envCode,
      resourcePrefix: props.resourcePrefix,
      googleOAuthSecret,
    });

    this.dns = new DnsConstruct(this, "Dns", {
      envCode: props.envCode,
      resourcePrefix: props.resourcePrefix,
    });

    this.dynamodb = new DynamoDbConstruct(this, "DynamoDB", {
      envCode: props.envCode,
      resourcePrefix: props.resourcePrefix,
    });

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

    // Consumed by the mobile app / CI `--outputs-file` workflow.
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
      value: `${this.cognito.userPoolDomain.domainName}.auth.${Regions.PRIMARY}.amazoncognito.com`,
      description:
        "Cognito hosted UI FQDN (no protocol). Mobile constructs `https://${HostedUiDomain}/oauth2/...` URLs from this.",
      exportName: `${props.resourcePrefix}-hosted-ui-domain`,
    });
    new cdk.CfnOutput(this, "HostedUiUrl", {
      value: this.cognito.hostedUiUrl(),
      description: "Full hosted UI URL the mobile app opens in the browser",
      exportName: `${props.resourcePrefix}-hosted-ui-url`,
    });
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
    new cdk.CfnOutput(this, "GraphQLApiId", {
      value: this.appsync.api.apiId,
      description: "AppSync GraphQL API ID",
      exportName: `${props.resourcePrefix}-graphql-api-id`,
    });
    new cdk.CfnOutput(this, "GraphQLEndpoint", {
      value: this.appsync.api.graphqlUrl,
      description:
        "AppSync GraphQL endpoint URL (REQUIRES id token in Authorization header)",
      exportName: `${props.resourcePrefix}-graphql-endpoint`,
    });
  }
}
