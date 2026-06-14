// Lambda resolver source for AppSync. This is a single inline
// string (passed to `lambda.Code.fromInline`); the Lambda runtime is
// Node 20 which ships with `aws-sdk` v2 globally, so no bundling is
// needed. AppSync invokes the same function for every operation; the
// handler dispatches on `info.fieldName`.
//
// Conventions:
//   - The caller's user id is in `identity.sub` (Cognito sub claim).
//   - DynamoDB client is constructed once at cold start.
//   - Every mutation updates a "touch" timestamp on the parent so
//     the next list query has an accurate `updatedAt`.
//   - Authorisation: "must be a member of the group" is enforced
//     by every resolver that touches a group's child resources.
//
// The handler is a single file because AppSync's Lambda data source
// expects one entrypoint.
export const RESOLVER_SOURCE = String.raw`// auto-generated; do not edit by hand
const AWS = require('aws-sdk');
const ddb = new AWS.DynamoDB.DocumentClient();

const GROUPS_TABLE = process.env.GROUPS_TABLE;
const MEMBERSHIPS_TABLE = process.env.MEMBERSHIPS_TABLE;
const INVITES_TABLE = process.env.INVITES_TABLE;
const LISTS_TABLE = process.env.LISTS_TABLE;
const ITEMS_TABLE = process.env.ITEMS_TABLE;

const newId = (prefix) => prefix + '_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
const nowIso = () => new Date().toISOString();
const err = (code, msg) => { const e = new Error(msg); e.code = code; throw e; };
const userId = (identity) => identity?.sub || identity?.username || err('unauthenticated', 'no identity');

async function isMember(groupId, uid) {
  const r = await ddb.get({ TableName: MEMBERSHIPS_TABLE, Key: { groupId, userId: uid } }).promise();
  return !!r.Item;
}
async function requireMember(groupId, uid) {
  if (!(await isMember(groupId, uid))) err('forbidden', 'not a member of this group');
}
async function countItems(table, keyExpr, values) {
  const r = await ddb.query({ TableName: table, KeyConditionExpression: keyExpr, ExpressionAttributeValues: values, Select: 'COUNT' }).promise();
  return r.Count || 0;
}
async function touchGroup(groupId) {
  await ddb.update({ TableName: GROUPS_TABLE, Key: { groupId }, UpdateExpression: 'SET updatedAt = :u', ExpressionAttributeValues: { ':u': nowIso() } }).promise();
}
async function touchList(listId) {
  await ddb.update({ TableName: LISTS_TABLE, Key: { listId }, UpdateExpression: 'SET updatedAt = :u', ExpressionAttributeValues: { ':u': nowIso() } }).promise();
}

const ops = {
  me: async (_a, identity) => {
    const sub = identity?.sub || identity?.username;
    if (!sub) return null;
    return { id: sub, email: '', name: '', createdAt: '' };
  },
  myGroups: async (_a, identity) => {
    const sub = userId(identity);
    const m = await ddb.query({ TableName: MEMBERSHIPS_TABLE, IndexName: 'ByUser', KeyConditionExpression: 'userId = :u', ExpressionAttributeValues: { ':u': sub } }).promise();
    const out = [];
    for (const mem of m.Items || []) {
      const g = await ddb.get({ TableName: GROUPS_TABLE, Key: { groupId: mem.groupId } }).promise();
      if (!g.Item) continue;
      const memberCount = await countItems(MEMBERSHIPS_TABLE, 'groupId = :g', { ':g': mem.groupId });
      const listCount = await countItems(LISTS_TABLE, 'groupId = :g', { ':g': mem.groupId });
      out.push({ ...g.Item, role: mem.role, memberCount, listCount });
    }
    return out.sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
  },
  group: async (args, identity) => {
    const sub = userId(identity);
    const groupId = String(args.id);
    await requireMember(groupId, sub);
    const g = await ddb.get({ TableName: GROUPS_TABLE, Key: { groupId } }).promise();
    if (!g.Item) err('not_found', 'group');
    const m = await ddb.get({ TableName: MEMBERSHIPS_TABLE, Key: { groupId, userId: sub } }).promise();
    const memberCount = await countItems(MEMBERSHIPS_TABLE, 'groupId = :g', { ':g': groupId });
    const listCount = await countItems(LISTS_TABLE, 'groupId = :g', { ':g': groupId });
    return { ...g.Item, role: m.Item?.role || 'member', memberCount, listCount };
  },
  listGroupMembers: async (args, identity) => {
    const sub = userId(identity);
    const groupId = String(args.groupId);
    await requireMember(groupId, sub);
    const r = await ddb.query({ TableName: MEMBERSHIPS_TABLE, KeyConditionExpression: 'groupId = :g', ExpressionAttributeValues: { ':g': groupId } }).promise();
    return (r.Items || []).map((m) => ({ ...m, user: { id: m.userId, email: '', name: '', createdAt: '' } }));
  },
  listsInGroup: async (args, identity) => {
    const sub = userId(identity);
    const groupId = String(args.groupId);
    await requireMember(groupId, sub);
    const r = await ddb.query({ TableName: LISTS_TABLE, IndexName: 'ByGroup', KeyConditionExpression: 'groupId = :g', ExpressionAttributeValues: { ':g': groupId } }).promise();
    return (r.Items || []).sort((a, b) => Number(a.order) - Number(b.order));
  },
  list: async (args, identity) => {
    const sub = userId(identity);
    const listId = String(args.id);
    const r = await ddb.get({ TableName: LISTS_TABLE, Key: { listId } }).promise();
    if (!r.Item) err('not_found', 'list');
    await requireMember(r.Item.groupId, sub);
    return r.Item;
  },
  itemsInList: async (args, identity) => {
    const sub = userId(identity);
    const listId = String(args.listId);
    const l = await ddb.get({ TableName: LISTS_TABLE, Key: { listId } }).promise();
    if (!l.Item) err('not_found', 'list');
    await requireMember(l.Item.groupId, sub);
    const r = await ddb.query({ TableName: ITEMS_TABLE, KeyConditionExpression: 'listId = :l', ExpressionAttributeValues: { ':l': listId } }).promise();
    return (r.Items || []).sort((a, b) => Number(a.order) - Number(b.order));
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
    const group = { groupId, name: input.name.trim(), emoji: input.emoji, color: input.color, createdBy: sub, createdAt: ts, updatedAt: ts };
    await ddb.put({ TableName: GROUPS_TABLE, Item: group }).promise();
    await ddb.put({ TableName: MEMBERSHIPS_TABLE, Item: { groupId, userId: sub, role: 'admin', joinedAt: ts } }).promise();
    return group;
  },
  inviteToGroup: async (args, identity) => {
    const sub = userId(identity);
    const groupId = String(args.groupId);
    const email = String(args.email || '').toLowerCase().trim();
    if (!email.includes('@')) err('validation', 'invalid email');
    await requireMember(groupId, sub);
    const inviteId = newId('invite');
    const ts = nowIso();
    const invite = { inviteId, groupId, email, invitedBy: sub, status: 'pending', createdAt: ts, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() };
    await ddb.put({ TableName: INVITES_TABLE, Item: invite }).promise();
    return invite;
  },
  createList: async (args, identity) => {
    const sub = userId(identity);
    const input = args.input;
    await requireMember(input.groupId, sub);
    const r = await ddb.query({ TableName: LISTS_TABLE, IndexName: 'ByGroup', KeyConditionExpression: 'groupId = :g', ExpressionAttributeValues: { ':g': input.groupId } }).promise();
    const maxOrder = (r.Items || []).reduce((acc, l) => Math.max(acc, Number(l.order || 0)), 0);
    const listId = newId('list');
    const ts = nowIso();
    const list = { listId, groupId: input.groupId, name: input.name, emoji: input.emoji, createdBy: sub, createdAt: ts, updatedAt: ts, order: maxOrder + 1 };
    await ddb.put({ TableName: LISTS_TABLE, Item: list }).promise();
    await touchGroup(input.groupId);
    return list;
  },
  deleteList: async (args, identity) => {
    const sub = userId(identity);
    const listId = String(args.listId);
    const l = await ddb.get({ TableName: LISTS_TABLE, Key: { listId } }).promise();
    if (!l.Item) err('not_found', 'list');
    await requireMember(l.Item.groupId, sub);
    const items = await ddb.query({ TableName: ITEMS_TABLE, KeyConditionExpression: 'listId = :l', ExpressionAttributeValues: { ':l': listId } }).promise();
    await Promise.all((items.Items || []).map((it) => ddb.delete({ TableName: ITEMS_TABLE, Key: { listId: it.listId, itemId: it.itemId } }).promise()));
    await ddb.delete({ TableName: LISTS_TABLE, Key: { listId } }).promise();
    await touchGroup(l.Item.groupId);
    return true;
  },
  addItem: async (args, identity) => {
    const sub = userId(identity);
    const input = args.input;
    if (!input.text?.trim()) err('validation', 'text is required');
    const l = await ddb.get({ TableName: LISTS_TABLE, Key: { listId: input.listId } }).promise();
    if (!l.Item) err('not_found', 'list');
    await requireMember(l.Item.groupId, sub);
    const r = await ddb.query({ TableName: ITEMS_TABLE, KeyConditionExpression: 'listId = :l', ExpressionAttributeValues: { ':l': input.listId } }).promise();
    const maxOrder = (r.Items || []).reduce((acc, it) => Math.max(acc, Number(it.order || 0)), 0);
    const itemId = newId('item');
    const ts = nowIso();
    const item = { itemId, listId: input.listId, text: input.text.trim(), checked: false, addedBy: sub, createdAt: ts, updatedAt: ts, order: maxOrder + 1 };
    await ddb.put({ TableName: ITEMS_TABLE, Item: item }).promise();
    await touchList(input.listId);
    await touchGroup(l.Item.groupId);
    return item;
  },
  toggleItem: async (args, identity) => {
    const sub = userId(identity);
    const listId = String(args.listId);
    const itemId = String(args.itemId);
    const l = await ddb.get({ TableName: LISTS_TABLE, Key: { listId } }).promise();
    if (!l.Item) err('not_found', 'list');
    await requireMember(l.Item.groupId, sub);
    const cur = await ddb.get({ TableName: ITEMS_TABLE, Key: { listId, itemId } }).promise();
    if (!cur.Item) err('not_found', 'item');
    const updated = { ...cur.Item, checked: !cur.Item.checked, updatedAt: nowIso() };
    await ddb.put({ TableName: ITEMS_TABLE, Item: updated }).promise();
    await touchList(listId);
    return updated;
  },
  updateItemText: async (args, identity) => {
    const sub = userId(identity);
    const listId = String(args.listId);
    const itemId = String(args.itemId);
    const text = String(args.text || '').trim();
    if (!text) err('validation', 'text is required');
    const l = await ddb.get({ TableName: LISTS_TABLE, Key: { listId } }).promise();
    if (!l.Item) err('not_found', 'list');
    await requireMember(l.Item.groupId, sub);
    const cur = await ddb.get({ TableName: ITEMS_TABLE, Key: { listId, itemId } }).promise();
    if (!cur.Item) err('not_found', 'item');
    const updated = { ...cur.Item, text, updatedAt: nowIso() };
    await ddb.put({ TableName: ITEMS_TABLE, Item: updated }).promise();
    await touchList(listId);
    return updated;
  },
  deleteItem: async (args, identity) => {
    const sub = userId(identity);
    const listId = String(args.listId);
    const itemId = String(args.itemId);
    const l = await ddb.get({ TableName: LISTS_TABLE, Key: { listId } }).promise();
    if (!l.Item) err('not_found', 'list');
    await requireMember(l.Item.groupId, sub);
    await ddb.delete({ TableName: ITEMS_TABLE, Key: { listId, itemId } }).promise();
    await touchList(listId);
    return true;
  },
  acceptInvite: async (_a, _i) => err('not_found', 'invite lookup not supported in v1'),
};

exports.handler = async (event) => {
  const args = event.arguments || {};
  const identity = event.identity || {};
  const fn = ops[event.info.fieldName];
  if (!fn) err('not_found', 'unknown field: ' + event.info.fieldName);
  return fn(args, identity);
};
`;
