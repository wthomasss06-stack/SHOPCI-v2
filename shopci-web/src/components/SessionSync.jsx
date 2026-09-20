'use client';

import { useEffect } from 'react';
import { signOut, useSession, getSession } from 'next-auth/react';
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
    async function run() {
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

        if (session?.error === 'RefreshFailed') {
          // Peut être transitoire (cold start Render, réseau) : on retente une fois
          // avant de conclure à une vraie déconnexion — évite de sortir l'utilisateur
          // pour un aléa qui se serait résolu tout seul au contrôle suivant.
          try {
            const fresh = await getSession();
            if (fresh?.accessToken) {
              setSession(fresh.accessToken, fresh.user);
              persistSessionUser(fresh.user);
              return;
            }
          } catch {
            // la nouvelle tentative a échoué aussi : on traite comme un vrai échec ci-dessous
          }
        }

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
    }

    run();
  }, [status, session]);

  return null;
}
