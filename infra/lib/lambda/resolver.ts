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
import { randomUUID } from 'node:crypto';

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

// The caller's verified email, from the Cognito id token claims AppSync
// forwards on `event.identity.claims`. Invites are keyed by email (the
// recipient may not have an account yet), so this is how a signed-in
// user discovers and accepts the invites addressed to them.
const callerEmail = (identity: any): string =>
  String(identity?.claims?.email || '').toLowerCase().trim();

// Display name from the id token (falls back to email). Denormalised
// onto the membership row at join time so `listGroupMembers` can show
// who's in a group without a separate user directory.
const callerName = (identity: any): string =>
  String(identity?.claims?.name || identity?.claims?.email || '').trim();

async function getMembership(groupId: string, uid: string): Promise<any | null> {
  const r = await ddb.send(
    new GetCommand({ TableName: MEMBERSHIPS_TABLE, Key: { groupId, userId: uid } }),
  );
  return r.Item ?? null;
}

async function isMember(groupId: string, uid: string): Promise<boolean> {
  return !!(await getMembership(groupId, uid));
}

async function requireMember(groupId: string, uid: string): Promise<void> {
  if (!(await isMember(groupId, uid))) err('forbidden', 'not a member of this group');
}

async function requireAdmin(groupId: string, uid: string): Promise<void> {
  const m = await getMembership(groupId, uid);
  if (!m) err('forbidden', 'not a member of this group');
  if (m.role !== 'admin') err('forbidden', 'only group admins can do that');
}

async function listMemberships(groupId: string): Promise<any[]> {
  const r = await ddb.send(
    new QueryCommand({
      TableName: MEMBERSHIPS_TABLE,
      KeyConditionExpression: 'groupId = :g',
      ExpressionAttributeValues: { ':g': groupId },
    }),
  );
  return r.Items || [];
}

// How many admins a group has. The core invariant everywhere below is
// that this never drops to zero, so a group is never left unmanageable.
// Counted server-side (Select: COUNT) so we don't pull every membership
// row over the wire just to count admins. `role` is a DynamoDB reserved
// word, hence the name placeholder.
async function adminCount(groupId: string): Promise<number> {
  const r = await ddb.send(
    new QueryCommand({
      TableName: MEMBERSHIPS_TABLE,
      KeyConditionExpression: 'groupId = :g',
      FilterExpression: '#r = :r',
      ExpressionAttributeNames: { '#r': 'role' },
      ExpressionAttributeValues: { ':g': groupId, ':r': 'admin' },
      Select: 'COUNT',
    }),
  );
  return r.Count || 0;
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

// Tear a group down completely: every list and its items, every
// membership, every invite, then the group row. Used by `deleteGroup`
// and by the sole-member `leaveGroup` path (which would otherwise
// orphan the group). Mirrors `deleteList`'s cascade, one level up.
async function deleteGroupCascade(groupId: string): Promise<void> {
  const lists = await ddb.send(
    new QueryCommand({
      TableName: LISTS_TABLE,
      IndexName: 'ByGroup',
      KeyConditionExpression: 'groupId = :g',
      ExpressionAttributeValues: { ':g': groupId },
    }),
  );
  await Promise.all(
    (lists.Items || []).map(async (l: any) => {
      const items = await ddb.send(
        new QueryCommand({
          TableName: ITEMS_TABLE,
          KeyConditionExpression: 'listId = :l',
          ExpressionAttributeValues: { ':l': l.listId },
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
      await ddb.send(new DeleteCommand({ TableName: LISTS_TABLE, Key: { listId: l.listId } }));
    }),
  );
  await Promise.all(
    (await listMemberships(groupId)).map((m) =>
      ddb.send(
        new DeleteCommand({ TableName: MEMBERSHIPS_TABLE, Key: { groupId, userId: m.userId } }),
      ),
    ),
  );
  const invites = await ddb.send(
    new QueryCommand({
      TableName: INVITES_TABLE,
      KeyConditionExpression: 'groupId = :g',
      ExpressionAttributeValues: { ':g': groupId },
    }),
  );
  await Promise.all(
    (invites.Items || []).map((inv: any) =>
      ddb.send(
        new DeleteCommand({ TableName: INVITES_TABLE, Key: { groupId, inviteId: inv.inviteId } }),
      ),
    ),
  );
  await ddb.send(new DeleteCommand({ TableName: GROUPS_TABLE, Key: { groupId } }));
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
function mapMembership(m: any) {
  return {
    groupId: m.groupId,
    userId: m.userId,
    role: m.role,
    joinedAt: m.joinedAt,
    user: {
      id: m.userId,
      email: m.email || '',
      name: m.name || m.email || '',
      createdAt: '',
    },
  };
}
// A shareable group invite link is just an Invites row with kind:'link'
// (no email). The `token` is the row's inviteId. Anyone signed in who
// presents a valid token joins — it is not bound to a specific address.
function mapInviteLink(inv: any) {
  return {
    groupId: inv.groupId,
    token: inv.inviteId,
    createdBy: inv.invitedBy,
    createdAt: inv.createdAt,
    expiresAt: inv.expiresAt,
  };
}

type Op = (args: any, identity: any) => Promise<any>;

const ops: Record<string, Op> = {
  me: async (_a, identity) => {
    const sub = identity?.sub || identity?.username;
    if (!sub) return null;
    const claims = identity?.claims || {};
    return {
      id: sub,
      email: String(claims.email || '').toLowerCase(),
      name: claims.name || claims.email || '',
      createdAt: '',
    };
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
    return (r.Items || []).map(mapMembership);
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
  pendingInvites: async (_a, identity) => {
    const email = callerEmail(identity);
    if (!email) return [];
    // Invites carry the recipient's email; the ByEmail GSI is the only
    // way to find "invites addressed to me" without scanning.
    const r = await ddb.send(
      new QueryCommand({
        TableName: INVITES_TABLE,
        IndexName: 'ByEmail',
        KeyConditionExpression: 'email = :e',
        ExpressionAttributeValues: { ':e': email },
      }),
    );
    const now = Date.now();
    const pending = (r.Items || []).filter(
      (inv: any) =>
        inv.status === 'pending' && new Date(inv.expiresAt).getTime() > now,
    );
    // Attach the group so the client can name what it's an invite to.
    // (No per-field resolver on `Invite.group`; AppSync reads it off the
    // object we return here.) Resolve all invites concurrently rather
    // than one round-trip at a time.
    const uid = userId(identity);
    const resolved = await Promise.all(
      pending.map(async (inv: any) => {
        const [g, member] = await Promise.all([
          ddb.send(new GetCommand({ TableName: GROUPS_TABLE, Key: { groupId: inv.groupId } })),
          isMember(inv.groupId, uid),
        ]);
        if (!g.Item) return null; // group deleted out from under the invite
        if (member) return null; // already acted on
        return { ...mapInvite(inv), group: mapGroup(g.Item) };
      }),
    );
    return resolved
      .filter((x): x is NonNullable<typeof x> => x !== null)
      .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  },
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
        Item: {
          groupId,
          userId: sub,
          role: 'admin',
          joinedAt: ts,
          // Denormalised profile so the member list can render names.
          email: callerEmail(identity),
          name: callerName(identity),
        },
      }),
    );
    return mapGroup(group);
  },
  inviteToGroup: async (args, identity) => {
    const sub = userId(identity);
    const groupId = String(args.groupId);
    const email = String(args.email || '').toLowerCase().trim();
    if (!email.includes('@')) err('validation', 'invalid email');
    // Inviting is an admin-only action.
    await requireAdmin(groupId, sub);
    // Don't pile up duplicate pending invites for the same person —
    // re-inviting just returns the live invite. (Invites are keyed by
    // groupId, so a single-partition query is cheap here.)
    const now = Date.now();
    const existing = await ddb.send(
      new QueryCommand({
        TableName: INVITES_TABLE,
        KeyConditionExpression: 'groupId = :g',
        ExpressionAttributeValues: { ':g': groupId },
      }),
    );
    const live = (existing.Items || []).find(
      (inv: any) =>
        inv.email === email &&
        inv.status === 'pending' &&
        new Date(inv.expiresAt).getTime() > now,
    );
    if (live) return mapInvite(live);
    const inviteId = newId('invite');
    const ts = nowIso();
    const expiresMs = now + 7 * 24 * 60 * 60 * 1000;
    const invite = {
      inviteId,
      groupId,
      email,
      invitedBy: sub,
      status: 'pending',
      createdAt: ts,
      expiresAt: new Date(expiresMs).toISOString(),
      // Numeric epoch-seconds copy of expiresAt for the table's DynamoDB
      // TTL, which auto-deletes expired invites. Read paths still filter
      // on `expiresAt` since TTL deletion can lag up to ~48h.
      ttl: Math.floor(expiresMs / 1000),
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
  acceptInvite: async (args, identity) => {
    const sub = userId(identity);
    const email = callerEmail(identity);
    if (!email) err('unauthenticated', 'no email on identity');
    const inviteId = String(args.inviteId);
    // The Invites table is keyed by (groupId, inviteId) and we only have
    // the inviteId, so we locate it through the ByEmail GSI scoped to the
    // caller. That doubles as authorisation: a user can only accept an
    // invite addressed to their own email.
    const r = await ddb.send(
      new QueryCommand({
        TableName: INVITES_TABLE,
        IndexName: 'ByEmail',
        KeyConditionExpression: 'email = :e',
        ExpressionAttributeValues: { ':e': email },
      }),
    );
    const invite = (r.Items || []).find((inv: any) => inv.inviteId === inviteId);
    if (!invite) err('not_found', 'invite not found');
    if (invite.status !== 'pending') err('conflict', 'invite is no longer pending');
    if (new Date(invite.expiresAt).getTime() <= Date.now())
      err('conflict', 'invite has expired');

    const groupId = invite.groupId;
    const g = await ddb.send(
      new GetCommand({ TableName: GROUPS_TABLE, Key: { groupId } }),
    );
    if (!g.Item) err('not_found', 'group no longer exists');

    const ts = nowIso();
    // Add the membership unless one already exists (re-accepting a stale
    // invite must not clobber an admin's role back down to member).
    try {
      await ddb.send(
        new PutCommand({
          TableName: MEMBERSHIPS_TABLE,
          Item: {
            groupId,
            userId: sub,
            role: 'member',
            joinedAt: ts,
            // Denormalised profile so the member list can render names.
            email,
            name: callerName(identity),
          },
          ConditionExpression: 'attribute_not_exists(groupId)',
        }),
      );
    } catch (e: any) {
      if (e?.name !== 'ConditionalCheckFailedException') throw e;
    }

    // Mark the invite accepted so it stops showing up as pending.
    // `status` is a DynamoDB reserved word, hence the name placeholder.
    await ddb.send(
      new UpdateCommand({
        TableName: INVITES_TABLE,
        Key: { groupId, inviteId },
        UpdateExpression: 'SET #s = :accepted, acceptedAt = :ts, acceptedBy = :u',
        ExpressionAttributeNames: { '#s': 'status' },
        ExpressionAttributeValues: { ':accepted': 'accepted', ':ts': ts, ':u': sub },
      }),
    );
    await touchGroup(groupId);
    return mapGroup(g.Item);
  },
  setMemberRole: async (args, identity) => {
    const sub = userId(identity);
    const groupId = String(args.groupId);
    const targetUserId = String(args.userId);
    const role = String(args.role);
    if (role !== 'admin' && role !== 'member') err('validation', 'invalid role');
    await requireAdmin(groupId, sub);
    const target = await getMembership(groupId, targetUserId);
    if (!target) err('not_found', 'that person is not a member of this group');
    if (target.role === role) return mapMembership(target); // already there
    // Never demote the last admin — a group must stay manageable.
    if (target.role === 'admin' && role === 'member' && (await adminCount(groupId)) <= 1)
      err('conflict', 'a group must have at least one admin');
    const updated = { ...target, role };
    await ddb.send(new PutCommand({ TableName: MEMBERSHIPS_TABLE, Item: updated }));
    await touchGroup(groupId);
    return mapMembership(updated);
  },
  removeMember: async (args, identity) => {
    const sub = userId(identity);
    const groupId = String(args.groupId);
    const targetUserId = String(args.userId);
    await requireAdmin(groupId, sub);
    if (targetUserId === sub) err('validation', 'use leaveGroup to remove yourself');
    const target = await getMembership(groupId, targetUserId);
    if (!target) err('not_found', 'that person is not a member of this group');
    if (target.role === 'admin' && (await adminCount(groupId)) <= 1)
      err('conflict', 'a group must have at least one admin');
    await ddb.send(
      new DeleteCommand({ TableName: MEMBERSHIPS_TABLE, Key: { groupId, userId: targetUserId } }),
    );
    await touchGroup(groupId);
    return true;
  },
  leaveGroup: async (args, identity) => {
    const sub = userId(identity);
    const groupId = String(args.groupId);
    const mine = await getMembership(groupId, sub);
    if (!mine) err('not_found', 'you are not a member of this group');
    const members = await listMemberships(groupId);
    const isLastAdmin =
      mine.role === 'admin' && members.filter((m) => m.role === 'admin').length <= 1;
    if (isLastAdmin && members.length > 1)
      err(
        'conflict',
        'promote another member to admin (or delete the group) before leaving',
      );
    if (isLastAdmin) {
      // Sole member of the group — leaving would orphan it, so remove it.
      await deleteGroupCascade(groupId);
      return true;
    }
    await ddb.send(new DeleteCommand({ TableName: MEMBERSHIPS_TABLE, Key: { groupId, userId: sub } }));
    await touchGroup(groupId);
    return true;
  },
  deleteGroup: async (args, identity) => {
    const sub = userId(identity);
    const groupId = String(args.groupId);
    await requireAdmin(groupId, sub);
    await deleteGroupCascade(groupId);
    return true;
  },
  createGroupInviteLink: async (args, identity) => {
    const sub = userId(identity);
    const groupId = String(args.groupId);
    await requireAdmin(groupId, sub);
    const now = Date.now();
    // Reuse an existing, unexpired link so the admin keeps a stable URL
    // instead of minting a new one on every open.
    const existing = await ddb.send(
      new QueryCommand({
        TableName: INVITES_TABLE,
        KeyConditionExpression: 'groupId = :g',
        ExpressionAttributeValues: { ':g': groupId },
      }),
    );
    const live = (existing.Items || []).find(
      (inv: any) =>
        inv.kind === 'link' &&
        inv.status === 'active' &&
        new Date(inv.expiresAt).getTime() > now,
    );
    if (live) return mapInviteLink(live);
    const token = 'lnk_' + randomUUID().replace(/-/g, '');
    const ts = nowIso();
    const expiresMs = now + 30 * 24 * 60 * 60 * 1000;
    const link = {
      groupId,
      inviteId: token,
      kind: 'link',
      invitedBy: sub,
      status: 'active',
      createdAt: ts,
      expiresAt: new Date(expiresMs).toISOString(),
      ttl: Math.floor(expiresMs / 1000),
    };
    await ddb.send(new PutCommand({ TableName: INVITES_TABLE, Item: link }));
    return mapInviteLink(link);
  },
  joinGroupViaLink: async (args, identity) => {
    const sub = userId(identity);
    const groupId = String(args.groupId);
    const token = String(args.token);
    // Token-based, NOT email-bound: anyone signed in who has the link joins.
    const r = await ddb.send(
      new GetCommand({ TableName: INVITES_TABLE, Key: { groupId, inviteId: token } }),
    );
    const link = r.Item;
    if (!link || link.kind !== 'link') err('not_found', 'invite link not found');
    if (link.status !== 'active') err('conflict', 'this invite link is no longer active');
    if (new Date(link.expiresAt).getTime() <= Date.now())
      err('conflict', 'this invite link has expired');
    const g = await ddb.send(new GetCommand({ TableName: GROUPS_TABLE, Key: { groupId } }));
    if (!g.Item) err('not_found', 'group no longer exists');
    const ts = nowIso();
    try {
      await ddb.send(
        new PutCommand({
          TableName: MEMBERSHIPS_TABLE,
          Item: {
            groupId,
            userId: sub,
            role: 'member',
            joinedAt: ts,
            email: callerEmail(identity),
            name: callerName(identity),
          },
          ConditionExpression: 'attribute_not_exists(groupId)',
        }),
      );
      await touchGroup(groupId);
    } catch (e: any) {
      // Already a member — idempotent, just return the group.
      if (e?.name !== 'ConditionalCheckFailedException') throw e;
    }
    return mapGroup(g.Item);
  },
};

export const handler = async (event: any) => {
  const args = event.arguments || {};
  const identity = event.identity || {};
  const fn = ops[event.info.fieldName];
  if (!fn) err('not_found', 'unknown field: ' + event.info.fieldName);
  return fn(args, identity);
};
