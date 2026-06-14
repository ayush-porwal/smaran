// Version hook. v1 with the real backend: triggers a re-render on
// session change. Per-resource subscription events are stubbed —
// when AppSync real-time subscriptions are wired in, this hook
// will listen to those instead.
import { useEffect, useState } from 'react';

import { subscribeSession } from './session';

export function useStoreVersion(_topic: string): number {
  const [version, setVersion] = useState(0);
  useEffect(() => {
    const unsub = subscribeSession(() => setVersion((v) => v + 1));
    return unsub;
  }, []);
  return version;
}
