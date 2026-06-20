import { useEffect, useState } from 'react';

import { subscribeSession, subscribeTopic } from './session';

export function useStoreVersion(topic: string): number {
  const [version, setVersion] = useState(0);
  useEffect(() => {
    // Session changes invalidate every topic, not just the requested one.
    const unsubSession = subscribeSession(() => setVersion((v) => v + 1));
    const unsubTopic = subscribeTopic(topic, () => setVersion((v) => v + 1));
    return () => {
      unsubSession();
      unsubTopic();
    };
  }, [topic]);
  return version;
}
