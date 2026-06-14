// AppSyncConstruct: the smaran GraphQL API.
//
// Architecture:
//   - AppSync GraphQL API with Cognito user pool as default auth.
//   - One Lambda function (Node 20, inline source) holds the
//     resolver dispatch logic for every field. AppSync invokes
//     the same Lambda for every Query/Mutation with
//     `event.info.fieldName` identifying the field.
//   - The Lambda has read/write IAM on the 5 DynamoDB tables.
//
// Why a single Lambda + dispatcher (vs. one resolver per field):
//   - Less CDK code (one DataSource, one resolver attached to
//     Query and Mutation type).
//   - Authorisation logic ("is the user a member of this group?")
//     is centralised in one file.
//   - The Lambda stays under 256MB (small cold start) and only
//     uses `aws-sdk` v2 which is built into the Node 20 runtime.
//
// Cognito auth: every operation requires an id token from the user
// pool. The Lambda reads `event.identity.sub` to identify the user.
import * as cdk from "aws-cdk-lib/core";
import * as appsync from "aws-cdk-lib/aws-appsync";
import * as cognito from "aws-cdk-lib/aws-cognito";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { Construct } from "constructs";
import * as path from "path";

import { RESOLVER_SOURCE } from "../graphql/resolvers";

export interface AppSyncConstructProps {
  envCode: string;
  resourcePrefix: string;
  userPool: cognito.UserPool;
  groupsTable: dynamodb.Table;
  membershipsTable: dynamodb.Table;
  invitesTable: dynamodb.Table;
  listsTable: dynamodb.Table;
  itemsTable: dynamodb.Table;
}

export class AppSyncConstruct extends Construct {
  public readonly api: appsync.GraphqlApi;

  constructor(scope: Construct, id: string, props: AppSyncConstructProps) {
    super(scope, id);

    // --- GraphQL API ---
    this.api = new appsync.GraphqlApi(this, "Api", {
      name: `${props.resourcePrefix}-api`,
      definition: appsync.Definition.fromFile(
        path.join(__dirname, "..", "graphql", "schema.graphql"),
      ),
      authorizationConfig: {
        defaultAuthorization: {
          authorizationType: appsync.AuthorizationType.USER_POOL,
          userPoolConfig: { userPool: props.userPool },
        },
        additionalAuthorizationModes: [],
      },
      xrayEnabled: false,
      // Introspection enabled in all envs; mobile dev tooling reads
      // the schema. Production-grade hardening (e.g. disabling
      // introspection in prod) is a one-line change.
      introspectionConfig: appsync.IntrospectionConfig.ENABLED,
    });

    // --- Lambda data source ---
    // The resolver function is a single inline string; the runtime
    // is Node 20 (aws-sdk v2 is pre-installed). No bundling step.
    const fn = new lambda.Function(this, "ResolverFn", {
      functionName: `${props.resourcePrefix}-appsync-resolver`,
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "index.handler",
      code: lambda.Code.fromInline(RESOLVER_SOURCE),
      memorySize: 256,
      timeout: cdk.Duration.seconds(10),
      environment: {
        GROUPS_TABLE: props.groupsTable.tableName,
        MEMBERSHIPS_TABLE: props.membershipsTable.tableName,
        INVITES_TABLE: props.invitesTable.tableName,
        LISTS_TABLE: props.listsTable.tableName,
        ITEMS_TABLE: props.itemsTable.tableName,
      },
      description: `smaran (${props.envCode}) AppSync resolver dispatcher`,
    });

    // Grant the Lambda read/write on the 5 tables.
    [props.groupsTable, props.membershipsTable, props.invitesTable, props.listsTable, props.itemsTable].forEach(
      (t) => {
        t.grantReadWriteData(fn);
      },
    );

    // --- Data source + resolvers ---
    // We attach one resolver per field. The Lambda dispatches on
    // `event.info.fieldName` in the handler.
    const ds = this.api.addLambdaDataSource("LambdaDs", fn);
    this.attachFieldResolvers(ds);
  }

  private attachFieldResolvers(ds: appsync.LambdaDataSource): void {
    const queryFields = [
      "me",
      "myGroups",
      "group",
      "listGroupMembers",
      "listsInGroup",
      "list",
      "itemsInList",
      "pendingInvites",
    ];
    const mutationFields = [
      "createGroup",
      "inviteToGroup",
      "createList",
      "deleteList",
      "addItem",
      "toggleItem",
      "updateItemText",
      "deleteItem",
      "acceptInvite",
    ];
    queryFields.forEach((field) => {
      ds.createResolver(`Q_${field}`, {
        typeName: "Query",
        fieldName: field,
        requestMappingTemplate: appsync.MappingTemplate.lambdaRequest(),
        responseMappingTemplate: appsync.MappingTemplate.lambdaResult(),
      });
    });
    mutationFields.forEach((field) => {
      ds.createResolver(`M_${field}`, {
        typeName: "Mutation",
        fieldName: field,
        requestMappingTemplate: appsync.MappingTemplate.lambdaRequest(),
        responseMappingTemplate: appsync.MappingTemplate.lambdaResult(),
      });
    });
  }
}
