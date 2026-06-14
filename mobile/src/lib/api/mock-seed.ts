// Seed data. One current user with a few groups, members, lists, and
// items so the screens have something to render on first boot. The
// shapes exactly match the types in `./types.ts`; if a type changes,
// this file is the second place to update (after the store).
import { membershipKey, store } from './mock-store';
import type { Group, GroupMembership, List, ListItem, User } from './types';

const now = () => new Date().toISOString();

const id = (prefix: string, n: number) => `${prefix}_${n}`;

const me: User = {
  id: 'user_me',
  email: 'you@smaran.app',
  name: 'Alex Chen',
  createdAt: '2026-01-15T09:00:00.000Z',
};

const ada: User = {
  id: 'user_ada',
  email: 'ada@smaran.app',
  name: 'Ada Lovelace',
  createdAt: '2026-01-16T09:00:00.000Z',
};

const grace: User = {
  id: 'user_grace',
  email: 'grace@smaran.app',
  name: 'Grace Hopper',
  createdAt: '2026-01-17T09:00:00.000Z',
};

const linus: User = {
  id: 'user_linus',
  email: 'linus@smaran.app',
  name: 'Linus Torvalds',
  createdAt: '2026-01-18T09:00:00.000Z',
};

const groups: Group[] = [
  {
    id: id('group', 1),
    name: 'Apartment',
    emoji: '🏠',
    color: 'indigo',
    createdBy: me.id,
    createdAt: '2026-02-01T10:00:00.000Z',
    updatedAt: '2026-02-01T10:00:00.000Z',
  },
  {
    id: id('group', 2),
    name: 'Trip to Lisbon',
    emoji: '✈️',
    color: 'amber',
    createdBy: me.id,
    createdAt: '2026-02-10T10:00:00.000Z',
    updatedAt: '2026-02-10T10:00:00.000Z',
  },
  {
    id: id('group', 3),
    name: 'Conference Talk',
    emoji: '🎤',
    color: 'rose',
    createdBy: ada.id,
    createdAt: '2026-02-12T10:00:00.000Z',
    updatedAt: '2026-02-12T10:00:00.000Z',
  },
];

const memberships: GroupMembership[] = [
  { groupId: id('group', 1), userId: me.id, role: 'admin', joinedAt: now() },
  { groupId: id('group', 1), userId: ada.id, role: 'member', joinedAt: now() },
  { groupId: id('group', 1), userId: grace.id, role: 'member', joinedAt: now() },
  { groupId: id('group', 2), userId: me.id, role: 'admin', joinedAt: now() },
  { groupId: id('group', 2), userId: linus.id, role: 'admin', joinedAt: now() },
  { groupId: id('group', 2), userId: ada.id, role: 'member', joinedAt: now() },
  { groupId: id('group', 3), userId: me.id, role: 'member', joinedAt: now() },
  { groupId: id('group', 3), userId: ada.id, role: 'admin', joinedAt: now() },
  { groupId: id('group', 3), userId: grace.id, role: 'member', joinedAt: now() },
  { groupId: id('group', 3), userId: linus.id, role: 'member', joinedAt: now() },
];

const lists: List[] = [
  // Group 1: Apartment
  {
    id: id('list', 1),
    groupId: id('group', 1),
    name: 'Groceries',
    emoji: '🛒',
    createdBy: me.id,
    createdAt: '2026-02-01T10:30:00.000Z',
    updatedAt: '2026-02-01T10:30:00.000Z',
    order: 1,
  },
  {
    id: id('list', 2),
    groupId: id('group', 1),
    name: 'To-do this week',
    emoji: '📋',
    createdBy: ada.id,
    createdAt: '2026-02-02T10:30:00.000Z',
    updatedAt: '2026-02-02T10:30:00.000Z',
    order: 2,
  },
  // Group 2: Trip to Lisbon
  {
    id: id('list', 3),
    groupId: id('group', 2),
    name: 'Packing',
    emoji: '🧳',
    createdBy: me.id,
    createdAt: '2026-02-10T11:00:00.000Z',
    updatedAt: '2026-02-10T11:00:00.000Z',
    order: 1,
  },
  {
    id: id('list', 4),
    groupId: id('group', 2),
    name: 'Restaurants to try',
    emoji: '🍽️',
    createdBy: linus.id,
    createdAt: '2026-02-10T11:05:00.000Z',
    updatedAt: '2026-02-10T11:05:00.000Z',
    order: 2,
  },
  // Group 3: Conference Talk
  {
    id: id('list', 5),
    groupId: id('group', 3),
    name: 'Outline',
    emoji: '📝',
    createdBy: ada.id,
    createdAt: '2026-02-12T12:00:00.000Z',
    updatedAt: '2026-02-12T12:00:00.000Z',
    order: 1,
  },
  {
    id: id('list', 6),
    groupId: id('group', 3),
    name: 'Reading list',
    emoji: '📚',
    createdBy: me.id,
    createdAt: '2026-02-12T12:10:00.000Z',
    updatedAt: '2026-02-12T12:10:00.000Z',
    order: 2,
  },
];

const items: ListItem[] = [
  // Groceries
  { id: id('item', 1), listId: id('list', 1), text: 'Eggs', checked: false, addedBy: me.id, createdAt: now(), updatedAt: now(), order: 1 },
  { id: id('item', 2), listId: id('list', 1), text: 'Bread', checked: true, addedBy: ada.id, createdAt: now(), updatedAt: now(), order: 2 },
  { id: id('item', 3), listId: id('list', 1), text: 'Coffee beans', checked: false, addedBy: grace.id, createdAt: now(), updatedAt: now(), order: 3 },
  { id: id('item', 4), listId: id('list', 1), text: 'Olive oil', checked: false, addedBy: me.id, createdAt: now(), updatedAt: now(), order: 4 },

  // To-do this week
  { id: id('item', 5), listId: id('list', 2), text: 'Pay rent', checked: false, addedBy: me.id, createdAt: now(), updatedAt: now(), order: 1 },
  { id: id('item', 6), listId: id('list', 2), text: 'Call plumber', checked: false, addedBy: ada.id, createdAt: now(), updatedAt: now(), order: 2 },

  // Packing
  { id: id('item', 7), listId: id('list', 3), text: 'Passport', checked: true, addedBy: me.id, createdAt: now(), updatedAt: now(), order: 1 },
  { id: id('item', 8), listId: id('list', 3), text: 'Sunscreen', checked: false, addedBy: linus.id, createdAt: now(), updatedAt: now(), order: 2 },
  { id: id('item', 9), listId: id('list', 3), text: 'Charger', checked: false, addedBy: ada.id, createdAt: now(), updatedAt: now(), order: 3 },

  // Restaurants
  { id: id('item', 10), listId: id('list', 4), text: 'Cervejaria Ramiro', checked: false, addedBy: linus.id, createdAt: now(), updatedAt: now(), order: 1 },
  { id: id('item', 11), listId: id('list', 4), text: 'Belcanto', checked: false, addedBy: ada.id, createdAt: now(), updatedAt: now(), order: 2 },
  { id: id('item', 12), listId: id('list', 4), text: 'Time Out Market', checked: true, addedBy: me.id, createdAt: now(), updatedAt: now(), order: 3 },

  // Outline
  { id: id('item', 13), listId: id('list', 5), text: 'Introduction', checked: true, addedBy: ada.id, createdAt: now(), updatedAt: now(), order: 1 },
  { id: id('item', 14), listId: id('list', 5), text: 'Main thesis', checked: false, addedBy: me.id, createdAt: now(), updatedAt: now(), order: 2 },
  { id: id('item', 15), listId: id('list', 5), text: 'Demo', checked: false, addedBy: ada.id, createdAt: now(), updatedAt: now(), order: 3 },
  { id: id('item', 16), listId: id('list', 5), text: 'Q&A prep', checked: false, addedBy: grace.id, createdAt: now(), updatedAt: now(), order: 4 },

  // Reading list
  { id: id('item', 17), listId: id('list', 6), text: 'Designing Data-Intensive Applications', checked: false, addedBy: me.id, createdAt: now(), updatedAt: now(), order: 1 },
  { id: id('item', 18), listId: id('list', 6), text: 'The Pragmatic Programmer', checked: true, addedBy: linus.id, createdAt: now(), updatedAt: now(), order: 2 },
];

let seeded = false;
export function seed(): void {
  if (seeded) return;
  for (const u of [me, ada, grace, linus]) store.users.set(u.id, u);
  for (const g of groups) store.groups.set(g.id, g);
  for (const m of memberships) {
    store.memberships.set(membershipKey(m.groupId, m.userId), m);
  }
  for (const l of lists) store.lists.set(l.id, l);
  for (const i of items) store.items.set(i.id, i);
  // Pre-authenticate as `me` for the demo. The real flow will start
  // sessionUserId as null and require sign-in.
  store.sessionUserId = me.id;
  seeded = true;
}
