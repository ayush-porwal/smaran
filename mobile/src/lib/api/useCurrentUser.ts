// Hook returning the current Cognito user. The session state is
// mirrored to a Zustand-like module variable (see `session.ts`)
// so screens re-render on sign-in / sign-out.
import { useEffect, useState } from 'react';

import { getCurrentUser } from '../auth';
import { subscribeSession } from './session';
import type { User } from './types';

export function useCurrentUser(): { user: User | null; loading: boolean } {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
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
    const unsub = subscribeSession(() => {
      getCurrentUser()
        .then((u) => {
          if (cancelled) return;
          setUser(u);
        })
        .catch(() => {
          if (cancelled) return;
          setUser(null);
        });
    });
    return () => {
      cancelled = true;
      unsub();
    };
  }, []);
  return { user, loading };
}
