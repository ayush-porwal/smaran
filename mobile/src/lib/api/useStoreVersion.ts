// React hook that returns a number incremented on any change to a
// resource topic. Components consume it as a useEffect dependency to
// trigger refetches after mutations. When we swap to AppSync, the
// subscription event handler will call `setVersion((v) => v + 1)`
// instead — the consumer code is identical.
import { useEffect, useState } from 'react';

import { subscribe } from './mock-store';

export function useStoreVersion(topic: string): number {
  const [version, setVersion] = useState(0);
  useEffect(() => {
    const unsubscribe = subscribe(topic as `group:${string}` | `list:${string}` | 'session', () => {
      setVersion((v) => v + 1);
    });
    return unsubscribe;
  }, [topic]);
  return version;
}
