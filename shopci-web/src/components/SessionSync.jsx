'use client';

import { useEffect } from 'react';
import { signOut, useSession } from 'next-auth/react';
import { setSession, clearSession } from '@/services/api';
import {
  persistSessionUser,
  readPersistedSession,
  isPersistedSessionExpired,
} from '@/lib/persistedSession';

async function forceLogout(reason) {
  clearSession();
  await signOut({ redirect: true, callbackUrl: '/login?reason=' + encodeURIComponent(reason || 'session_expired') });
}

/**
 * Lie NextAuth (cookie httpOnly) ↔ store mémoire API ↔ localStorage (30 jours).
 * Cookie / session NextAuth supprimés → status unauthenticated → purge localStorage.
 */
export default function SessionSync() {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === 'loading') return;

    if (isPersistedSessionExpired()) {
      forceLogout('session_expired');
      return;
    }

    if (status === 'authenticated' && session?.accessToken && !session?.error) {
      setSession(session.accessToken, session.user);
      persistSessionUser(session.user);
      return;
    }

    if (status === 'unauthenticated' || session?.error) {
      const hadLocalSession = !!readPersistedSession();
      clearSession();

      if (session?.error) {
        forceLogout(session.error);
        return;
      }

      // Cookie NextAuth supprimé alors que le localStorage indiquait une session
      if (hadLocalSession && typeof window !== 'undefined') {
        window.location.replace('/login?reason=cookies_cleared');
      }
    }
  }, [status, session]);

  return null;
}
