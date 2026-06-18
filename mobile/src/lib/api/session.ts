// Module-level pub/sub for client-side invalidation. Two distinct
// event types share this module:
//
// 1. Session events — fired on sign-in / sign-out via
//    `notifySessionChanged()`. Subscribers: the AppSync client
//    (drops the token cache), any screen that wants to refetch
//    user-scoped data on auth transitions.
//
// 2. Per-resource events — fired by `bumpVersion(topic)` after
//    mutations (`'group:any'`, `'list:<id>'`, `'group:<id>'`,
//    etc.). Subscribers: `useStoreVersion(topic)` re-renders when
//    its topic is bumped so React Query / Apollo / custom hooks
//    refetch.
//
// Per-resource bumps are still a client-side pub/sub stub today:
// mutation handlers in `graphql.ts` are the planned call sites
// but are not wired yet. AppSync real-time subscriptions
// (`graphql-ws` over a `wss://` endpoint) are the future phase.
type Listener = () => void;

const sessionListeners = new Set<Listener>();

export function subscribeSession(fn: Listener): () => void {
  sessionListeners.add(fn);
  return () => {
    sessionListeners.delete(fn);
  };
}

export function notifySessionChanged(): void {
  for (const l of sessionListeners) l();
}

const topicListeners = new Map<string, Set<Listener>>();

export function subscribeTopic(topic: string, fn: Listener): () => void {
  let set = topicListeners.get(topic);
  if (!set) {
    set = new Set();
    topicListeners.set(topic, set);
  }
  set.add(fn);
  return () => {
    set!.delete(fn);
    if (set!.size === 0) topicListeners.delete(topic);
  };
}

/** Bump the version for `topic`. All subscribers are notified. */
export function bumpVersion(topic: string): void {
  topicListeners.get(topic)?.forEach((l) => l());
}
