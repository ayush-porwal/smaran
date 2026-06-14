// Module-level session signal. The auth layer calls
// `notifySessionChanged()` on sign-in / sign-out; hooks subscribe
// via `subscribeSession`. The AppSync client uses the same hook
// to know when to drop the token cache.
type Listener = () => void;
const listeners = new Set<Listener>();

export function subscribeSession(fn: Listener): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function notifySessionChanged(): void {
  for (const l of listeners) l();
}
