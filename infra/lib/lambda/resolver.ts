// Lambda resolver for AppSync. Bundled and deployed via
// `NodejsFunction` (esbuild via CDK). AWS SDK v3 — Node.js 20 Lambda
// doesn't bundle v2 anymore, and bundling v2 ourselves would be larger
// than just switching to v3's modular imports.
//
// AppSync invokes this same function for every operation; we
// dispatch on `event.info.fieldName` to the right handler.
//
// Conventions:
//   - The caller's user id is in `event.identity.sub` (Cognito).
//   - DynamoDB client is constructed once at cold start.
//   - The GraphQL schema uses `id` for every entity; DynamoDB stores
//     them as `groupId`/`listId`/`itemId`/`inviteId`. We map at the
//     boundary so the response shape matches the schema.
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DeleteCommand,
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

const GROUPS_TABLE = process.env.GROUPS_TABLE!;
const MEMBERSHIPS_TABLE = process.env.MEMBERSHIPS_TABLE!;
const INVITES_TABLE = process.env.INVITES_TABLE!;
const LISTS_TABLE = process.env.LISTS_TABLE!;
const ITEMS_TABLE = process.env.ITEMS_TABLE!;

const newId = (prefix: string) =>
  `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
const nowIso = () => new Date().toISOString();
function err(code: string, msg: string): never {
  const e = new Error(msg) as Error & { code: string };
  e.code = code;
  throw e;
}
const userId = (identity: any) =>
  identity?.sub || identity?.username || err('unauthenticated', 'no identity');

async function isMember(groupId: string, uid: string): Promise<boolean> {
  const r = await ddb.send(
    new GetCommand({ TableName: MEMBERSHIPS_TABLE, Key: { groupId, userId: uid } }),
  );
  return !!r.Item;
}

async function requireMember(groupId: string, uid: string): Promise<void> {
  if (!(await isMember(groupId, uid))) err('forbidden', 'not a member of this group');
}

async function countItems(
  table: string,
  keyExpr: string,
  values: Record<string, unknown>,
  indexName?: string,
): Promise<number> {
  const r = await ddb.send(
    new QueryCommand({
      TableName: table,
      KeyConditionExpression: keyExpr,
      ExpressionAttributeValues: values,
      Select: 'COUNT',
      ...(indexName ? { IndexName: indexName } : {}),
    }),
  );
  return r.Count || 0;
}

async function touchGroup(groupId: string): Promise<void> {
  await ddb.send(
    new UpdateCommand({
      TableName: GROUPS_TABLE,
      Key: { groupId },
      UpdateExpression: 'SET updatedAt = :u',
      ExpressionAttributeValues: { ':u': nowIso() },
    }),
  );
}

async function touchList(listId: string): Promise<void> {
  await ddb.send(
    new UpdateCommand({
      TableName: LISTS_TABLE,
      Key: { listId },
      UpdateExpression: 'SET updatedAt = :u',
      ExpressionAttributeValues: { ':u': nowIso() },
    }),
  );
}

// --- Schema mappers (DDB row → GraphQL shape) ---
function mapGroup(g: any) {
  return {
    id: g.groupId,
    name: g.name,
    emoji: g.emoji,
    color: g.color,
    createdBy: g.createdBy,
    createdAt: g.createdAt,
    updatedAt: g.updatedAt,
  };
}
function mapList(l: any) {
  return {
    id: l.listId,
    groupId: l.groupId,
    name: l.name,
    emoji: l.emoji,
    createdBy: l.createdBy,
    createdAt: l.createdAt,
    updatedAt: l.updatedAt,
    order: Number(l.order || 0),
  };
}
function mapItem(it: any) {
  return {
    id: it.itemId,
    listId: it.listId,
    text: it.text,
    checked: !!it.checked,
    addedBy: it.addedBy,
    createdAt: it.createdAt,
    updatedAt: it.updatedAt,
    order: Number(it.order || 0),
  };
}
function mapInvite(inv: any) {
  return {
    id: inv.inviteId,
    groupId: inv.groupId,
    email: inv.email,
    invitedBy: inv.invitedBy,
    status: inv.status,
    createdAt: inv.createdAt,
    expiresAt: inv.expiresAt,
  };
}

type Op = (args: any, identity: any) => Promise<any>;

const ops: Record<string, Op> = {
  me: async (_a, identity) => {
    const sub = identity?.sub || identity?.username;
    if (!sub) return null;
    return { id: sub, email: '', name: '', createdAt: '' };
  },
  myGroups: async (_a, identity) => {
    const sub = userId(identity);
    const m = await ddb.send(
      new QueryCommand({
        TableName: MEMBERSHIPS_TABLE,
        IndexName: 'ByUser',
        KeyConditionExpression: 'userId = :u',
        ExpressionAttributeValues: { ':u': sub },
      }),
    );
    const out = [];
    for (const mem of m.Items || []) {
      const g = await ddb.send(new GetCommand({ TableName: GROUPS_TABLE, Key: { groupId: mem.groupId } }));
      if (!g.Item) continue;
      const memberCount = await countItems(MEMBERSHIPS_TABLE, 'groupId = :g', { ':g': mem.groupId });
      // LISTS_TABLE.PK = listId; groupId is reachable only through
      // the ByGroup GSI. Without IndexName, DynamoDB rejects the query.
      const listCount = await countItems(LISTS_TABLE, 'groupId = :g', { ':g': mem.groupId }, 'ByGroup');
      out.push({ ...mapGroup(g.Item), role: mem.role, memberCount, listCount });
    }
    return out.sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
  },
  group: async (args, identity) => {
    const sub = userId(identity);
    const groupId = String(args.id);
    await requireMember(groupId, sub);
    const g = await ddb.send(new GetCommand({ TableName: GROUPS_TABLE, Key: { groupId } }));
    if (!g.Item) err('not_found', 'group');
    const m = await ddb.send(new GetCommand({ TableName: MEMBERSHIPS_TABLE, Key: { groupId, userId: sub } }));
    const memberCount = await countItems(MEMBERSHIPS_TABLE, 'groupId = :g', { ':g': groupId });
    const listCount = await countItems(LISTS_TABLE, 'groupId = :g', { ':g': groupId }, 'ByGroup');
    return { ...mapGroup(g.Item), role: m.Item?.role || 'member', memberCount, listCount };
  },
  listGroupMembers: async (args, identity) => {
    const sub = userId(identity);
    const groupId = String(args.groupId);
    await requireMember(groupId, sub);
    const r = await ddb.send(
      new QueryCommand({
        TableName: MEMBERSHIPS_TABLE,
        KeyConditionExpression: 'groupId = :g',
        ExpressionAttributeValues: { ':g': groupId },
      }),
    );
    return (r.Items || []).map((m: any) => ({
      groupId: m.groupId,
      userId: m.userId,
      role: m.role,
      joinedAt: m.joinedAt,
      user: { id: m.userId, email: '', name: '', createdAt: '' },
    }));
  },
  listsInGroup: async (args, identity) => {
    const sub = userId(identity);
    const groupId = String(args.groupId);
    await requireMember(groupId, sub);
    const r = await ddb.send(
      new QueryCommand({
        TableName: LISTS_TABLE,
        IndexName: 'ByGroup',
        KeyConditionExpression: 'groupId = :g',
        ExpressionAttributeValues: { ':g': groupId },
      }),
    );
    return (r.Items || []).map(mapList).sort((a, b) => a.order - b.order);
  },
  list: async (args, identity) => {
    const sub = userId(identity);
    const listId = String(args.id);
    const r = await ddb.send(new GetCommand({ TableName: LISTS_TABLE, Key: { listId } }));
    if (!r.Item) err('not_found', 'list');
    await requireMember(r.Item.groupId, sub);
    return mapList(r.Item);
  },
  itemsInList: async (args, identity) => {
    const sub = userId(identity);
    const listId = String(args.listId);
    const l = await ddb.send(new GetCommand({ TableName: LISTS_TABLE, Key: { listId } }));
    if (!l.Item) err('not_found', 'list');
    await requireMember(l.Item.groupId, sub);
    const r = await ddb.send(
      new QueryCommand({
        TableName: ITEMS_TABLE,
        KeyConditionExpression: 'listId = :l',
        ExpressionAttributeValues: { ':l': listId },
      }),
    );
    return (r.Items || []).map(mapItem).sort((a, b) => a.order - b.order);
  },
  pendingInvites: async (_a, _i) => [],
  createGroup: async (args, identity) => {
    const sub = userId(identity);
    const input = args.input;
    if (!input.name?.trim()) err('validation', 'name is required');
    if (!input.emoji) err('validation', 'emoji is required');
    if (!input.color) err('validation', 'color is required');
    const groupId = newId('group');
    const ts = nowIso();
    const group = {
      groupId,
      name: input.name.trim(),
      emoji: input.emoji,
      color: input.color,
      createdBy: sub,
      createdAt: ts,
      updatedAt: ts,
    };
    await ddb.send(new PutCommand({ TableName: GROUPS_TABLE, Item: group }));
    await ddb.send(
      new PutCommand({
        TableName: MEMBERSHIPS_TABLE,
        Item: { groupId, userId: sub, role: 'admin', joinedAt: ts },
      }),
    );
    return mapGroup(group);
  },
  inviteToGroup: async (args, identity) => {
    const sub = userId(identity);
    const groupId = String(args.groupId);
    const email = String(args.email || '').toLowerCase().trim();
    if (!email.includes('@')) err('validation', 'invalid email');
    await requireMember(groupId, sub);
    const inviteId = newId('invite');
    const ts = nowIso();
    const invite = {
      inviteId,
      groupId,
      email,
      invitedBy: sub,
      status: 'pending',
      createdAt: ts,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    };
    await ddb.send(new PutCommand({ TableName: INVITES_TABLE, Item: invite }));
    return mapInvite(invite);
  },
  createList: async (args, identity) => {
    const sub = userId(identity);
    const input = args.input;
    await requireMember(input.groupId, sub);
    const r = await ddb.send(
      new QueryCommand({
        TableName: LISTS_TABLE,
        IndexName: 'ByGroup',
        KeyConditionExpression: 'groupId = :g',
        ExpressionAttributeValues: { ':g': input.groupId },
      }),
    );
    const maxOrder = (r.Items || []).reduce(
      (acc: number, l: any) => Math.max(acc, Number(l.order || 0)),
      0,
    );
    const listId = newId('list');
    const ts = nowIso();
    const list = {
      listId,
      groupId: input.groupId,
      name: input.name,
      emoji: input.emoji,
      createdBy: sub,
      createdAt: ts,
      updatedAt: ts,
      order: maxOrder + 1,
    };
    await ddb.send(new PutCommand({ TableName: LISTS_TABLE, Item: list }));
    await touchGroup(input.groupId);
    return mapList(list);
  },
  deleteList: async (args, identity) => {
    const sub = userId(identity);
    const listId = String(args.listId);
    const l = await ddb.send(new GetCommand({ TableName: LISTS_TABLE, Key: { listId } }));
    if (!l.Item) err('not_found', 'list');
    await requireMember(l.Item.groupId, sub);
    const items = await ddb.send(
      new QueryCommand({
        TableName: ITEMS_TABLE,
        KeyConditionExpression: 'listId = :l',
        ExpressionAttributeValues: { ':l': listId },
      }),
    );
    await Promise.all(
      (items.Items || []).map((it: any) =>
        ddb.send(
          new DeleteCommand({
            TableName: ITEMS_TABLE,
            Key: { listId: it.listId, itemId: it.itemId },
          }),
        ),
      ),
    );
    await ddb.send(new DeleteCommand({ TableName: LISTS_TABLE, Key: { listId } }));
    await touchGroup(l.Item.groupId);
    return true;
  },
  addItem: async (args, identity) => {
    const sub = userId(identity);
    const input = args.input;
    if (!input.text?.trim()) err('validation', 'text is required');
    const l = await ddb.send(new GetCommand({ TableName: LISTS_TABLE, Key: { listId: input.listId } }));
    if (!l.Item) err('not_found', 'list');
    await requireMember(l.Item.groupId, sub);
    const r = await ddb.send(
      new QueryCommand({
        TableName: ITEMS_TABLE,
        KeyConditionExpression: 'listId = :l',
        ExpressionAttributeValues: { ':l': input.listId },
      }),
    );
    const maxOrder = (r.Items || []).reduce(
      (acc: number, it: any) => Math.max(acc, Number(it.order || 0)),
      0,
    );
    const itemId = newId('item');
    const ts = nowIso();
    const item = {
      itemId,
      listId: input.listId,
      text: input.text.trim(),
      checked: false,
      addedBy: sub,
      createdAt: ts,
      updatedAt: ts,
      order: maxOrder + 1,
    };
    await ddb.send(new PutCommand({ TableName: ITEMS_TABLE, Item: item }));
    await touchList(input.listId);
    await touchGroup(l.Item.groupId);
    return mapItem(item);
  },
  toggleItem: async (args, identity) => {
    const sub = userId(identity);
    const listId = String(args.listId);
    const itemId = String(args.itemId);
    const l = await ddb.send(new GetCommand({ TableName: LISTS_TABLE, Key: { listId } }));
    if (!l.Item) err('not_found', 'list');
    await requireMember(l.Item.groupId, sub);
    const cur = await ddb.send(new GetCommand({ TableName: ITEMS_TABLE, Key: { listId, itemId } }));
    if (!cur.Item) err('not_found', 'item');
    const updated = { ...cur.Item, checked: !cur.Item.checked, updatedAt: nowIso() };
    await ddb.send(new PutCommand({ TableName: ITEMS_TABLE, Item: updated }));
    await touchList(listId);
    return mapItem(updated);
  },
  updateItemText: async (args, identity) => {
    const sub = userId(identity);
    const listId = String(args.listId);
    const itemId = String(args.itemId);
    const text = String(args.text || '').trim();
    if (!text) err('validation', 'text is required');
    const l = await ddb.send(new GetCommand({ TableName: LISTS_TABLE, Key: { listId } }));
    if (!l.Item) err('not_found', 'list');
    await requireMember(l.Item.groupId, sub);
    const cur = await ddb.send(new GetCommand({ TableName: ITEMS_TABLE, Key: { listId, itemId } }));
    if (!cur.Item) err('not_found', 'item');
    const updated = { ...cur.Item, text, updatedAt: nowIso() };
    await ddb.send(new PutCommand({ TableName: ITEMS_TABLE, Item: updated }));
    await touchList(listId);
    return mapItem(updated);
  },
  deleteItem: async (args, identity) => {
    const sub = userId(identity);
    const listId = String(args.listId);
    const itemId = String(args.itemId);
    const l = await ddb.send(new GetCommand({ TableName: LISTS_TABLE, Key: { listId } }));
    if (!l.Item) err('not_found', 'list');
    await requireMember(l.Item.groupId, sub);
    await ddb.send(new DeleteCommand({ TableName: ITEMS_TABLE, Key: { listId, itemId } }));
    await touchList(listId);
    return true;
  },
  acceptInvite: async (_a, _i) => err('not_found', 'invite lookup not supported in v1'),
};

export const handler = async (event: any) => {
  const args = event.arguments || {};
  const identity = event.identity || {};
  const fn = ops[event.info.fieldName];
  if (!fn) err('not_found', 'unknown field: ' + event.info.fieldName);
  return fn(args, identity);
};
