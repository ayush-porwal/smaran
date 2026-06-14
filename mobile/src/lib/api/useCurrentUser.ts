// Convenience hook for the current user. Returns `{ user, loading }`
// and re-fetches when the session topic changes (sign-in / sign-out).
import { useEffect, useState } from 'react';

import { getCurrentUser } from './mock';
import type { User } from './types';
import { useStoreVersion } from './useStoreVersion';

export function useCurrentUser(): { user: User | null; loading: boolean } {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const sessionVersion = useStoreVersion('session');
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getCurrentUser()
      .then((u) => {
        if (cancelled) return;
        setUser(u);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setUser(null);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [sessionVersion]);
  return { user, loading };
}
