import GoogleProvider from 'next-auth/providers/google';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
const ACCESS_TOKEN_LIFETIME_MS = 30 * 60 * 1000; // doit matcher SIMPLE_JWT.ACCESS_TOKEN_LIFETIME côté Django
const SESSION_MAX_AGE_SEC = 30 * 24 * 60 * 60; // 30 jours — aligné localStorage + refresh Django

async function exchangeGoogleToken(googleIdToken) {
  const res = await fetch(`${API_BASE_URL}/users/google-auth/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id_token: googleIdToken }),
  });
  if (!res.ok) throw new Error('Échec de l\'échange du token Google contre les JWT ShopCI');
  return res.json(); // { user, tokens: { access, refresh } }
}

async function refreshDjangoToken(refreshToken) {
  const res = await fetch(`${API_BASE_URL}/users/token/refresh/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh: refreshToken }),
  });
  if (!res.ok) throw new Error('Échec du rafraîchissement du token');
  return res.json(); // { access, refresh? }
}

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  session: { strategy: 'jwt', maxAge: SESSION_MAX_AGE_SEC },
  jwt: { maxAge: SESSION_MAX_AGE_SEC },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: '/login',
  },
  callbacks: {
    // Tourne côté serveur uniquement — le refresh token Django ne quitte jamais
    // ce callback, donc jamais le JS du navigateur : c'est ça qui remplace le
    // JWT en localStorage.
    async jwt({ token, account }) {
      if (account?.id_token) {
        try {
          const { user, tokens } = await exchangeGoogleToken(account.id_token);
          token.shopciUser = user;
          token.onboardingCompleted = !!user?.onboarding_completed;
          token.djangoAccess = tokens.access;
          token.djangoRefresh = tokens.refresh;
          token.accessExpires = Date.now() + ACCESS_TOKEN_LIFETIME_MS;
          token.error = undefined;
        } catch (err) {
          token.error = 'GoogleExchangeFailed';
          delete token.djangoAccess;
          delete token.djangoRefresh;
          delete token.accessExpires;
        }
        return token;
      }

      // Si une erreur de rafraîchissement a déjà eu lieu, ne pas retenter indéfiniment
      if (token.error === 'RefreshFailed' || token.error === 'GoogleExchangeFailed') {
        return token;
      }

      // Access token encore valide (avec 60s de marge) : rien à faire
      if (token.accessExpires && Date.now() < token.accessExpires - 60_000) {
        return token;
      }

      // Expiré : on rafraîchit côté serveur
      if (token.djangoRefresh) {
        try {
          const resData = await refreshDjangoToken(token.djangoRefresh);
          token.djangoAccess = resData.access;
          if (resData.refresh) {
            token.djangoRefresh = resData.refresh;
          }
          token.accessExpires = Date.now() + ACCESS_TOKEN_LIFETIME_MS;
          token.error = undefined;
        } catch (err) {
          token.error = 'RefreshFailed';
          delete token.djangoAccess;
          delete token.djangoRefresh;
          delete token.accessExpires;
        }
      } else {
        token.error = 'RefreshFailed';
      }

      return token;
    },

    // Seul l'access token (courte durée de vie) atteint le client, jamais le refresh token.
    async session({ session, token }) {
      if (token.error) {
        session.accessToken = null;
        session.error = token.error;
        session.user = null;
        return session;
      }

      session.accessToken = token.djangoAccess || null;
      session.error = undefined;
      if (token.shopciUser) {
        session.user = { ...session.user, ...token.shopciUser, onboarding_completed: token.onboardingCompleted ?? token.shopciUser?.onboarding_completed ?? false };
      }
      return session;
    },
  },
};
