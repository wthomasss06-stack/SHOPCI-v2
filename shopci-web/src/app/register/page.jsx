'use client';

import { useState, useEffect, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { ShieldCheck } from 'lucide-react';

function LogoShopCI({ size = 34 }) {
  return (
    <svg viewBox="0 0 140 34" height={size} fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="34" height="34" rx="8" fill="#f97316"/>
      <path d="M7 11h3l3.5 10h8.5l3-8H11" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="14.5" cy="24.5" r="1.5" fill="white"/>
      <circle cx="21" cy="24.5" r="1.5" fill="white"/>
      <text x="42" y="25" fontFamily="'DM Sans',sans-serif" fontSize="20" fontWeight="800" letterSpacing="-0.5" fill="currentColor">Shop</text>
      <text x="91" y="25" fontFamily="'DM Sans',sans-serif" fontSize="20" fontWeight="800" fill="#f97316" letterSpacing="-0.5">CI</text>
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18">
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.56 2.7-3.87 2.7-6.62z"/>
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.96v2.33A9 9 0 0 0 9 18z"/>
      <path fill="#FBBC05" d="M3.95 10.7A5.4 5.4 0 0 1 3.67 9c0-.59.1-1.17.28-1.7V4.97H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.03l2.99-2.33z"/>
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.97l2.99 2.33C4.66 5.17 6.65 3.58 9 3.58z"/>
    </svg>
  );
}

function useDark() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    setDark(document.body.classList.contains('dark'));
    const obs = new MutationObserver(() => setDark(document.body.classList.contains('dark')));
    obs.observe(document.body, { attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);
  return dark;
}

function RegisterInner() {
  const dark = useDark();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);

  const handleGoogle = async () => {
    setLoading(true);
    await signIn('google', { callbackUrl: searchParams.get('callbackUrl') || '/' });
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: dark ? '#0a0a0a' : '#fafafa', padding: 20,
      fontFamily: "'DM Sans', system-ui, sans-serif",
    }}>
      <div style={{
        width: '100%', maxWidth: 400, background: dark ? '#1a1a1a' : '#fff',
        border: `1px solid ${dark ? '#2a2a2a' : '#e5e7eb'}`, borderRadius: 20,
        padding: '40px 32px', textAlign: 'center',
        color: dark ? '#f5f5f7' : '#111827',
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
          <LogoShopCI />
        </div>

        <h1 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 8px' }}>Créer un compte</h1>
        <p style={{ fontSize: 14, color: dark ? '#a1a1aa' : '#6b7280', margin: '0 0 28px', lineHeight: 1.5 }}>
          Un seul clic avec Google — ton compte acheteur est prêt immédiatement. Tu pourras devenir vendeur ensuite depuis ton profil.
        </p>

        <button
          type="button"
          onClick={handleGoogle}
          disabled={loading}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            background: '#fff', color: '#1f1f1f', border: '1px solid #dadce0',
            borderRadius: 12, padding: '13px 20px', fontSize: 15, fontWeight: 600,
            cursor: loading ? 'default' : 'pointer', opacity: loading ? 0.7 : 1,
          }}
        >
          <GoogleIcon />
          {loading ? 'Création…' : "S'inscrire avec Google"}
        </button>

        <p style={{ fontSize: 12, color: dark ? '#71717a' : '#9ca3af', marginTop: 24, lineHeight: 1.6 }}>
          <ShieldCheck size={12} style={{ verticalAlign: '-2px', marginRight: 4 }} />
          En continuant, tu acceptes les <a href="/cgu" style={{ color: '#f97316' }}>CGU</a> et la{' '}
          <a href="/cgu#confidentialite" style={{ color: '#f97316' }}>politique de confidentialité</a> de ShopCI.
        </p>

        <p style={{ fontSize: 13, marginTop: 20 }}>
          Déjà un compte ? <a href="/login" style={{ color: '#f97316', fontWeight: 600 }}>Se connecter</a>
        </p>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterInner />
    </Suspense>
  );
}
