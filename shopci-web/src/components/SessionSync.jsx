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
    if (status === 'authenticated' && session?.accessToken) {
      setSession(session.accessToken, session.user);
    } else if (status === 'unauthenticated') {
      clearSession();
    }
  }, [status, session]);

  return null;
}
