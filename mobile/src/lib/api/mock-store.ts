// In-memory store + a tiny pub/sub for change notifications.
//
// Why pub/sub now: the UI demos "real-time" by listening for store
// changes after a mutation. When we swap to AppSync, the same component
// code will subscribe to GraphQL subscriptions instead — the listener
// pattern is identical, so the swap is invisible to consumers.
import type {
  Group,
  GroupMembership,
  Invite,
  List,
  ListItem,
  User,
} from './types';

type Topic = `group:${string}` | `list:${string}` | 'session';

type Store = {
  users: Map<string, User>;
  groups: Map<string, Group>;
  memberships: Map<string, GroupMembership>; // key: `${groupId}:${userId}`
  invites: Map<string, Invite>;
  lists: Map<string, List>; // key: listId
  items: Map<string, ListItem>; // key: itemId
  sessionUserId: string | null;
};

export const store: Store = {
  users: new Map(),
  groups: new Map(),
  memberships: new Map(),
  invites: new Map(),
  lists: new Map(),
  items: new Map(),
  sessionUserId: null,
};

const subscribers = new Map<Topic, Set<() => void>>();

export function subscribe(topic: Topic, callback: () => void): () => void {
  const set = subscribers.get(topic) ?? new Set<() => void>();
  set.add(callback);
  subscribers.set(topic, set);
  return () => {
    set.delete(callback);
  };
}

export function publish(topic: Topic): void {
  const set = subscribers.get(topic);
  if (!set) return;
  for (const cb of set) cb();
}

// Memberships are keyed by composite `${groupId}:${userId}`. These
// helpers keep the key construction in one place.
export const membershipKey = (groupId: string, userId: string) =>
  `${groupId}:${userId}` as const;
