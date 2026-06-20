/**
 * Five core tables (PAY_PER_REQUEST, retention driven by `envCode`):
 *
 *   Groups         PK = groupId
 *                  GSI: ByOwner (ownerUserId, createdAt)
 *   GroupMemberships
 *                  PK = groupId, SK = userId
 *                  GSI: ByUser (userId, joinedAt)
 *   Invites        PK = groupId, SK = inviteId
 *                  GSI: ByEmail (email, createdAt)
 *   Lists          PK = listId
 *                  GSI: ByGroup (groupId, createdAt)
 *   ListItems      PK = listId, SK = itemId
 *                  GSI: ByCreator (createdByUserId, createdAt)
 */
import * as cdk from 'aws-cdk-lib/core';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';

import { EnvCodes, retentionFor } from '../constants';

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
    const isRetain = retentionFor(props.envCode) === 'retain';
    const removalPolicy = isRetain ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY;

    const common: Omit<dynamodb.TableProps, 'tableName' | 'partitionKey' | 'sortKey'> = {
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecovery: isRetain,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      removalPolicy,
    };

    this.groupsTable = new dynamodb.Table(this, 'GroupsTable', {
      ...common,
      tableName: `${resourcePrefix}-groups`,
      partitionKey: { name: 'groupId', type: dynamodb.AttributeType.STRING },
    });
    this.groupsTable.addGlobalSecondaryIndex({
      indexName: 'ByOwner',
      partitionKey: { name: 'ownerUserId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    this.membershipsTable = new dynamodb.Table(this, 'MembershipsTable', {
      ...common,
      tableName: `${resourcePrefix}-group-memberships`,
      partitionKey: { name: 'groupId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
    });
    this.membershipsTable.addGlobalSecondaryIndex({
      indexName: 'ByUser',
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'joinedAt', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    this.invitesTable = new dynamodb.Table(this, 'InvitesTable', {
      ...common,
      tableName: `${resourcePrefix}-invites`,
      partitionKey: { name: 'groupId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'inviteId', type: dynamodb.AttributeType.STRING },
      // Resolver writes `ttl` (epoch seconds) alongside ISO `expiresAt`.
      timeToLiveAttribute: 'ttl',
    });
    this.invitesTable.addGlobalSecondaryIndex({
      indexName: 'ByEmail',
      partitionKey: { name: 'email', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    this.listsTable = new dynamodb.Table(this, 'ListsTable', {
      ...common,
      tableName: `${resourcePrefix}-lists`,
      partitionKey: { name: 'listId', type: dynamodb.AttributeType.STRING },
    });
    this.listsTable.addGlobalSecondaryIndex({
      indexName: 'ByGroup',
      partitionKey: { name: 'groupId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    this.itemsTable = new dynamodb.Table(this, 'ItemsTable', {
      ...common,
      tableName: `${resourcePrefix}-list-items`,
      partitionKey: { name: 'listId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'itemId', type: dynamodb.AttributeType.STRING },
    });
    this.itemsTable.addGlobalSecondaryIndex({
      indexName: 'ByCreator',
      partitionKey: { name: 'createdByUserId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });
  }
}
