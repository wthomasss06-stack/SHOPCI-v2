'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { setSession, clearSession } from '@/services/api';

/**
 * Fait le lien entre la session NextAuth (cookie httpOnly, gérée côté serveur)
 * et le store en mémoire que services/api.js utilise pour les appels Django.
 * Rendu une seule fois, à la racine — ne touche jamais localStorage.
 */
export default function SessionSync() {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === 'authenticated' && session?.accessToken && !session?.error) {
      setSession(session.accessToken, session.user);
    } else if (status === 'unauthenticated' || session?.error) {
      clearSession();
      if (session?.error) {
        import('next-auth/react').then(({ signOut }) => {
          signOut({ redirect: true, callbackUrl: '/login' });
        });
      }
    }
  }, [status, session]);

  return null;
}
