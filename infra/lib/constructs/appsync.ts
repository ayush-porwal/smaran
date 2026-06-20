/**
 * Single Lambda resolver dispatches on `event.info.fieldName` — keeps
 * auth logic centralised and CDK wiring minimal (one data source).
 * Node.js 20 Lambda has no bundled aws-sdk v2; `NodejsFunction` bundles
 * AWS SDK v3 via esbuild.
 */
import * as cdk from "aws-cdk-lib/core";
import * as appsync from "aws-cdk-lib/aws-appsync";
import * as cognito from "aws-cdk-lib/aws-cognito";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as lambdaNodejs from "aws-cdk-lib/aws-lambda-nodejs";
import { Construct } from "constructs";
import * as path from "path";

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
      introspectionConfig: appsync.IntrospectionConfig.ENABLED,
    });

    const fn = new lambdaNodejs.NodejsFunction(this, "ResolverFn", {
      functionName: `${props.resourcePrefix}-appsync-resolver`,
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: path.join(__dirname, "..", "lambda", "resolver.ts"),
      handler: "handler",
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
      bundling: {
        minify: true,
        sourceMap: false,
        target: "es2020",
      },
    });

    [props.groupsTable, props.membershipsTable, props.invitesTable, props.listsTable, props.itemsTable].forEach(
      (t) => {
        t.grantReadWriteData(fn);
      },
    );

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
      "deleteGroup",
      "inviteToGroup",
      "createGroupInviteLink",
      "joinGroupViaLink",
      "setMemberRole",
      "removeMember",
      "leaveGroup",
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
