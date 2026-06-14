// Mock API surface. Mirrors what the eventual AppSync / GraphQL schema
// will expose, so the swap to the real client is a one-line change in
// `client.ts`. All functions return Promises with simulated latency so
// loading states render naturally.
import { ApiError, type AuthSession, type SignInInput, type SignUpInput } from './types';
import type {
  AddItemInput,
  CreateGroupInput,
  CreateListInput,
  Group,
  GroupMembership,
  GroupWithMeta,
  Invite,
  List,
  ListItem,
  User,
} from './types';

import { membershipKey, publish, store, subscribe } from './mock-store';
import { seed } from './mock-seed';

// Simulated network latency. 180ms reads fast enough to feel instant
// but slow enough that the loading state is visible.
const latency = (ms = 180) => new Promise<void>((r) => setTimeout(r, ms));

const newId = (prefix: string) =>
  `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

const now = () => new Date().toISOString();

function requireSession(): User {
  if (!store.sessionUserId) {
    throw new ApiError('unauthenticated', 'Not signed in');
  }
  const user = store.users.get(store.sessionUserId);
  if (!user) throw new ApiError('unauthenticated', 'Session user missing');
  return user;
}

// --- Auth ----------------------------------------------------------------

export async function signIn(input: SignInInput): Promise<AuthSession> {
  await latency();
  // For the mock, the only valid credentials are any email that already
  // exists in the seed. Other emails throw a validation error.
  const user = [...store.users.values()].find(
    (u) => u.email.toLowerCase() === input.email.toLowerCase(),
  );
  if (!user) {
    throw new ApiError('validation', 'No account with that email');
  }
  store.sessionUserId = user.id;
  publish('session');
  return { user, token: `mock.${user.id}` };
}

export async function signUp(input: SignUpInput): Promise<AuthSession> {
  await latency();
  const existing = [...store.users.values()].find(
    (u) => u.email.toLowerCase() === input.email.toLowerCase(),
  );
  if (existing) throw new ApiError('conflict', 'An account with that email exists');
  const user: User = {
    id: newId('user'),
    email: input.email,
    name: input.name,
    createdAt: now(),
  };
  store.users.set(user.id, user);
  store.sessionUserId = user.id;
  publish('session');
  return { user, token: `mock.${user.id}` };
}

export async function signOut(): Promise<void> {
  await latency(80);
  store.sessionUserId = null;
  publish('session');
}

export async function getCurrentUser(): Promise<User | null> {
  await latency(40);
  if (!store.sessionUserId) return null;
  return store.users.get(store.sessionUserId) ?? null;
}

// --- Groups --------------------------------------------------------------

export async function listMyGroups(): Promise<GroupWithMeta[]> {
  await latency();
  const me = requireSession();
  const memberships = [...store.memberships.values()].filter(
    (m) => m.userId === me.id,
  );
  const results: GroupWithMeta[] = [];
  for (const m of memberships) {
    const g = store.groups.get(m.groupId);
    if (!g) continue;
    const memberCount = [...store.memberships.values()].filter(
      (mem) => mem.groupId === g.id,
    ).length;
    const listCount = [...store.lists.values()].filter(
      (l) => l.groupId === g.id,
    ).length;
    results.push({ ...g, role: m.role, memberCount, listCount });
  }
  // Most recently updated first.
  return results.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function getGroup(groupId: string): Promise<GroupWithMeta> {
  await latency();
  requireSession();
  const g = store.groups.get(groupId);
  if (!g) throw new ApiError('not_found', 'Group not found');
  const memberCount = [...store.memberships.values()].filter(
    (m) => m.groupId === g.id,
  ).length;
  const listCount = [...store.lists.values()].filter((l) => l.groupId === g.id).length;
  const me = requireSession();
  const membership = store.memberships.get(membershipKey(g.id, me.id));
  return { ...g, role: membership?.role ?? 'member', memberCount, listCount };
}

export async function createGroup(input: CreateGroupInput): Promise<Group> {
  await latency();
  const me = requireSession();
  const group: Group = {
    id: newId('group'),
    name: input.name,
    emoji: input.emoji,
    color: input.color,
    createdBy: me.id,
    createdAt: now(),
    updatedAt: now(),
  };
  store.groups.set(group.id, group);
  store.memberships.set(membershipKey(group.id, me.id), {
    groupId: group.id,
    userId: me.id,
    role: 'admin',
    joinedAt: now(),
  });
  publish(`group:${group.id}`);
  return group;
}

export async function listGroupMembers(
  groupId: string,
): Promise<Array<GroupMembership & { user: User }>> {
  await latency();
  requireSession();
  if (!store.groups.has(groupId)) throw new ApiError('not_found', 'Group not found');
  return [...store.memberships.values()]
    .filter((m) => m.groupId === groupId)
    .map((m) => {
      const user = store.users.get(m.userId);
      if (!user) throw new ApiError('not_found', 'Member user missing');
      return { ...m, user };
    });
}

export async function inviteToGroup(
  groupId: string,
  email: string,
): Promise<Invite> {
  await latency();
  const me = requireSession();
  if (!store.groups.has(groupId)) throw new ApiError('not_found', 'Group not found');
  const invite: Invite = {
    id: newId('invite'),
    groupId,
    email: email.toLowerCase(),
    invitedBy: me.id,
    status: 'pending',
    createdAt: now(),
    // Mock TTL: 7 days
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  };
  store.invites.set(invite.id, invite);
  return invite;
}

// --- Lists ---------------------------------------------------------------

export async function listsInGroup(groupId: string): Promise<List[]> {
  await latency();
  requireSession();
  if (!store.groups.has(groupId)) throw new ApiError('not_found', 'Group not found');
  return [...store.lists.values()]
    .filter((l) => l.groupId === groupId)
    .sort((a, b) => a.order - b.order);
}

export async function getList(listId: string): Promise<List> {
  await latency();
  requireSession();
  const list = store.lists.get(listId);
  if (!list) throw new ApiError('not_found', 'List not found');
  return list;
}

export async function createList(input: CreateListInput): Promise<List> {
  await latency();
  const me = requireSession();
  if (!store.groups.has(input.groupId)) throw new ApiError('not_found', 'Group not found');
  const maxOrder = [...store.lists.values()]
    .filter((l) => l.groupId === input.groupId)
    .reduce((acc, l) => Math.max(acc, l.order), 0);
  const list: List = {
    id: newId('list'),
    groupId: input.groupId,
    name: input.name,
    emoji: input.emoji,
    createdBy: me.id,
    createdAt: now(),
    updatedAt: now(),
    order: maxOrder + 1,
  };
  store.lists.set(list.id, list);
  publish(`group:${input.groupId}`);
  return list;
}

export async function deleteList(listId: string): Promise<void> {
  await latency();
  requireSession();
  const list = store.lists.get(listId);
  if (!list) throw new ApiError('not_found', 'List not found');
  store.lists.delete(listId);
  // Cascade: drop items
  for (const [id, item] of store.items) {
    if (item.listId === listId) store.items.delete(id);
  }
  publish(`group:${list.groupId}`);
}

// --- Items ---------------------------------------------------------------

export async function itemsInList(listId: string): Promise<ListItem[]> {
  await latency();
  requireSession();
  if (!store.lists.has(listId)) throw new ApiError('not_found', 'List not found');
  return [...store.items.values()]
    .filter((i) => i.listId === listId)
    .sort((a, b) => a.order - b.order);
}

export async function addItem(input: AddItemInput): Promise<ListItem> {
  await latency();
  const me = requireSession();
  const list = store.lists.get(input.listId);
  if (!list) throw new ApiError('not_found', 'List not found');
  const maxOrder = [...store.items.values()]
    .filter((i) => i.listId === input.listId)
    .reduce((acc, i) => Math.max(acc, i.order), 0);
  const item: ListItem = {
    id: newId('item'),
    listId: input.listId,
    text: input.text,
    checked: false,
    addedBy: me.id,
    createdAt: now(),
    updatedAt: now(),
    order: maxOrder + 1,
  };
  store.items.set(item.id, item);
  touchList(list);
  publish(`list:${input.listId}`);
  publish(`group:${list.groupId}`);
  return item;
}

export async function toggleItem(itemId: string): Promise<ListItem> {
  await latency();
  requireSession();
  const item = store.items.get(itemId);
  if (!item) throw new ApiError('not_found', 'Item not found');
  const updated: ListItem = { ...item, checked: !item.checked, updatedAt: now() };
  store.items.set(itemId, updated);
  const list = store.lists.get(item.listId);
  if (list) touchList(list);
  publish(`list:${item.listId}`);
  return updated;
}

export async function updateItemText(
  itemId: string,
  text: string,
): Promise<ListItem> {
  await latency();
  requireSession();
  const item = store.items.get(itemId);
  if (!item) throw new ApiError('not_found', 'Item not found');
  const updated: ListItem = { ...item, text, updatedAt: now() };
  store.items.set(itemId, updated);
  const list = store.lists.get(item.listId);
  if (list) touchList(list);
  publish(`list:${item.listId}`);
  return updated;
}

export async function deleteItem(itemId: string): Promise<void> {
  await latency();
  requireSession();
  const item = store.items.get(itemId);
  if (!item) return;
  store.items.delete(itemId);
  const list = store.lists.get(item.listId);
  if (list) touchList(list);
  publish(`list:${item.listId}`);
}

function touchList(list: List): void {
  const updated = { ...list, updatedAt: now() };
  store.lists.set(list.id, updated);
}

// --- Subscriptions -------------------------------------------------------

// Tiny pub/sub shim that mirrors the shape of an AppSync subscription
// observer: subscribe, then receive events until `unsubscribe()` is
// called. Components use this the same way they will use AppSync.

export type Unsubscribe = () => void;
export type Listener = (data: { type: string }) => void;

export function subscribeToGroup(groupId: string, listener: Listener): Unsubscribe {
  return subscribe(`group:${groupId}`, () => listener({ type: 'group' }));
}

export function subscribeToList(listId: string, listener: Listener): Unsubscribe {
  return subscribe(`list:${listId}`, () => listener({ type: 'list' }));
}

// --- Module init ---------------------------------------------------------

// Seed the store the first time the module is imported. Idempotent.
seed();
