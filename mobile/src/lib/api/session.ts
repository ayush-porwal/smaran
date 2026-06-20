/**
 * Client-side invalidation pub/sub. Session events (sign-in/out via
 * notifySessionChanged) and per-resource bumps (bumpVersion). Mutation
 * handlers do not call bumpVersion yet; AppSync subscriptions are future work.
 */
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

export function bumpVersion(topic: string): void {
  topicListeners.get(topic)?.forEach((l) => l());
}
