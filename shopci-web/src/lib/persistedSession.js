/** Persistance client ShopCI — 30 jours, synchronisée avec la session NextAuth (cookie). */

export const SESSION_STORAGE_KEY = 'shopci_session';
export const SESSION_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

const LEGACY_KEYS = ['user', 'access_token', 'refresh_token'];

export function persistSessionUser(user) {
  if (typeof window === 'undefined' || !user) return;
  try {
    const payload = {
      user,
      expiresAt: Date.now() + SESSION_MAX_AGE_MS,
      savedAt: Date.now(),
    };
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    /* quota / mode privé */
  }
}

export function readPersistedSession() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data?.expiresAt || Date.now() > data.expiresAt) {
      clearPersistedSession();
      return null;
    }
    return data;
  } catch {
    clearPersistedSession();
    return null;
  }
}

export function clearPersistedSession() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    LEGACY_KEYS.forEach((key) => localStorage.removeItem(key));
  } catch {
    /* ignore */
  }
}

export function isPersistedSessionExpired() {
  if (typeof window === 'undefined') return false;
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return false;
    const data = JSON.parse(raw);
    return !!data?.expiresAt && Date.now() > data.expiresAt;
  } catch {
    return false;
  }
}
