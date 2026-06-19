// Version hook. Re-renders whenever `topic` is bumped via
// `bumpVersion(topic)`. Call sites that want to refetch on a
// specific mutation (e.g. after `addItem`) include `topic` in
// their effect dependency on `useStoreVersion(topic)` so a bump
// invalidates them.
//
// Today, mutation handlers in `graphql.ts` do not yet call
// `bumpVersion`. AppSync real-time subscriptions (the eventual
// replacement) are tracked as future work.
import { useEffect, useState } from 'react';

import { subscribeSession, subscribeTopic } from './session';

export function useStoreVersion(topic: string): number {
  const [version, setVersion] = useState(0);
  useEffect(() => {
    // Always listen to session-level changes (sign-in / sign-out)
    // regardless of the requested topic, since `useCurrentUser`
    // depends on those.
    const unsubSession = subscribeSession(() => setVersion((v) => v + 1));
    const unsubTopic = subscribeTopic(topic, () => setVersion((v) => v + 1));
    return () => {
      unsubSession();
      unsubTopic();
    };
  }, [topic]);
  return version;
}
