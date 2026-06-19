// DynamoDbConstruct: the five core tables for the smaran app.
// All tables use PAY_PER_REQUEST billing (no provisioned capacity
// to manage) and have a retention policy driven by `envCode`.
//
// Access patterns the schema has to support:
//   1. List all groups a user is a member of (membership lookup)
//   2. List all members of a group (membership lookup)
//   3. Fetch a single group / list / item by id
//   4. List all lists in a group
//   5. List all items in a list
//   6. List pending invites for a user (by email)
//
// Schema:
//   Groups         PK = groupId
//                  GSI: ByOwner (ownerUserId PK, createdAt SK)
//
//   GroupMemberships
//                  PK = groupId, SK = userId
//                  GSI: ByUser (userId PK, joinedAt SK)
//
//   Invites        PK = groupId, SK = inviteId
//                  GSI: ByEmail (email PK, createdAt SK)
//
//   Lists          PK = listId
//                  GSI: ByGroup (groupId PK, createdAt SK)
//
//   ListItems      PK = listId, SK = itemId
//                  GSI: ByCreator (createdByUserId PK, createdAt SK)
import * as cdk from "aws-cdk-lib/core";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import { Construct } from "constructs";

import { EnvCodes, retentionFor } from "../constants";

export interface DynamoDbConstructProps {
  envCode: EnvCodes;
  resourcePrefix: string;
}

export class DynamoDbConstruct extends Construct {
  public readonly groupsTable: dynamodb.Table;
  public readonly membershipsTable: dynamodb.Table;
  public readonly invitesTable: dynamodb.Table;
  public readonly listsTable: dynamodb.Table;
  public readonly itemsTable: dynamodb.Table;

  constructor(scope: Construct, id: string, props: DynamoDbConstructProps) {
    super(scope, id);

    const { resourcePrefix } = props;
    const isRetain = retentionFor(props.envCode) === "retain";
    const removalPolicy = isRetain
      ? cdk.RemovalPolicy.RETAIN
      : cdk.RemovalPolicy.DESTROY;

    const common: Omit<dynamodb.TableProps, "tableName" | "partitionKey" | "sortKey"> = {
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      // Point-in-time recovery (PITR) lets us restore to any
      // second in the last 35 days. Costs ~20% extra on storage;
      // turned on for prod only.
      pointInTimeRecovery: isRetain,
      // Encryption at rest with AWS-managed KMS keys (free).
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      removalPolicy,
    };

    // --- Groups ---
    this.groupsTable = new dynamodb.Table(this, "GroupsTable", {
      ...common,
      tableName: `${resourcePrefix}-groups`,
      partitionKey: { name: "groupId", type: dynamodb.AttributeType.STRING },
    });
    this.groupsTable.addGlobalSecondaryIndex({
      indexName: "ByOwner",
      partitionKey: { name: "ownerUserId", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "createdAt", type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // --- Group Memberships ---
    this.membershipsTable = new dynamodb.Table(this, "MembershipsTable", {
      ...common,
      tableName: `${resourcePrefix}-group-memberships`,
      partitionKey: { name: "groupId", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "userId", type: dynamodb.AttributeType.STRING },
    });
    this.membershipsTable.addGlobalSecondaryIndex({
      indexName: "ByUser",
      partitionKey: { name: "userId", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "joinedAt", type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // --- Invites ---
    this.invitesTable = new dynamodb.Table(this, "InvitesTable", {
      ...common,
      tableName: `${resourcePrefix}-invites`,
      partitionKey: { name: "groupId", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "inviteId", type: dynamodb.AttributeType.STRING },
      // Expired invites auto-delete; the resolver writes `ttl` as
      // epoch seconds alongside the ISO `expiresAt`.
      timeToLiveAttribute: "ttl",
    });
    this.invitesTable.addGlobalSecondaryIndex({
      indexName: "ByEmail",
      partitionKey: { name: "email", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "createdAt", type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // --- Lists ---
    this.listsTable = new dynamodb.Table(this, "ListsTable", {
      ...common,
      tableName: `${resourcePrefix}-lists`,
      partitionKey: { name: "listId", type: dynamodb.AttributeType.STRING },
    });
    this.listsTable.addGlobalSecondaryIndex({
      indexName: "ByGroup",
      partitionKey: { name: "groupId", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "createdAt", type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // --- List Items ---
    this.itemsTable = new dynamodb.Table(this, "ItemsTable", {
      ...common,
      tableName: `${resourcePrefix}-list-items`,
      partitionKey: { name: "listId", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "itemId", type: dynamodb.AttributeType.STRING },
    });
    this.itemsTable.addGlobalSecondaryIndex({
      indexName: "ByCreator",
      partitionKey: { name: "createdByUserId", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "createdAt", type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });
  }
}
