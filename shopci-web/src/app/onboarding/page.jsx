'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Check, ChevronLeft, ChevronRight, ShieldCheck, UserRound, Store, Sparkles } from 'lucide-react';

const stepTitles = [
  { title: 'Votre identité', icon: UserRound },
  { title: 'Votre profil', icon: Store },
  { title: 'Validation', icon: ShieldCheck },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    user_type: 'acheteur',
    cgu_accepted: false,
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (status === 'authenticated') {
      const firstName = session?.user?.first_name || '';
      const lastName = session?.user?.last_name || '';
      const googleName = session?.user?.name || '';
      const split = googleName.trim().split(/\s+/);

      setForm((current) => ({
        ...current,
        first_name: current.first_name || firstName || split[0] || '',
        last_name: current.last_name || lastName || split.slice(1).join(' ') || '',
        user_type: current.user_type || session?.user?.user_type || 'acheteur',
      }));

      if (session?.user?.onboarding_completed) {
        router.replace('/');
      }
    }
  }, [status, session, router]);

  const canContinue = useMemo(() => {
    if (step === 0) return form.first_name.trim() && form.last_name.trim();
    if (step === 1) return !!form.user_type;
    return form.cgu_accepted;
  }, [form, step]);

  const updateField = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const handleNext = () => {
    setError('');
    if (!canContinue) return;
    setStep((current) => Math.min(current + 1, 2));
  };

  const handleBack = () => {
    setError('');
    setStep((current) => Math.max(current - 1, 0));
  };

  const handleSubmit = async () => {
    if (!canContinue) return;
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/users/onboarding/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.accessToken}`,
        },
        body: JSON.stringify({
          first_name: form.first_name,
          last_name: form.last_name,
          user_type: form.user_type,
          cgu_accepted: !!form.cgu_accepted,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const firstError = Object.values(data)[0];
        throw new Error(Array.isArray(firstError) ? firstError[0] : firstError || 'Le formulaire est incomplet.');
      }

      router.push('/');
    } catch (err) {
      setError(err.message || 'Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#fafafa', color: '#111827' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontWeight: 600 }}>Chargement…</div>
      </div>
    );
  }

  const CurrentStepIcon = stepTitles[step].icon;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 720, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 28, boxShadow: '0 10px 30px rgba(15,23,42,0.08)', overflow: 'hidden' }}>
        <div style={{ background: 'linear-gradient(135deg, #fff7ed 0%, #fff 100%)', borderBottom: '1px solid #f3f4f6', padding: '28px 32px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 42, height: 42, borderRadius: 14, background: '#fff7ed', color: '#f97316', display: 'grid', placeItems: 'center' }}>
                <Sparkles size={20} />
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#f97316', textTransform: 'uppercase', letterSpacing: 1 }}>ShopCI</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#111827' }}>Bienvenue</div>
              </div>
            </div>
            <div style={{ fontSize: 12, color: '#6b7280', fontWeight: 700 }}>Étape {step + 1} / 3</div>
          </div>

          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            {stepTitles.map((item, index) => {
              const isActive = index === step;
              const isDone = index < step;
              const Icon = item.icon;
              return (
                <div key={item.title} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 10,
                    background: isDone ? '#f97316' : isActive ? '#fff7ed' : '#f3f4f6',
                    color: isDone || isActive ? '#f97316' : '#9ca3af',
                    display: 'grid', placeItems: 'center', border: `1px solid ${isDone || isActive ? '#fed7aa' : '#e5e7eb'}`,
                  }}>
                    {isDone ? <Check size={16} /> : <Icon size={16} />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ padding: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: '#fff7ed', color: '#f97316', display: 'grid', placeItems: 'center' }}>
              <CurrentStepIcon size={20} />
            </div>
            <h2 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: '#111827' }}>{stepTitles[step].title}</h2>
          </div>

          {error && (
            <div style={{ marginBottom: 20, background: '#fee2e2', border: '1px solid #fecaca', color: '#991b1b', borderRadius: 12, padding: '12px 14px', fontSize: 14 }}>
              {error}
            </div>
          )}

          {step === 0 && (
            <div style={{ display: 'grid', gap: 18 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 8, color: '#374151' }}>Prénom</label>
                <input
                  value={form.first_name}
                  onChange={(e) => updateField('first_name', e.target.value)}
                  placeholder="Votre prénom"
                  style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: 12, padding: '12px 14px', fontSize: 15 }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 8, color: '#374151' }}>Nom</label>
                <input
                  value={form.last_name}
                  onChange={(e) => updateField('last_name', e.target.value)}
                  placeholder="Votre nom"
                  style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: 12, padding: '12px 14px', fontSize: 15 }}
                />
              </div>
            </div>
          )}

          {step === 1 && (
            <div style={{ display: 'grid', gap: 14 }}>
              <div style={{ fontSize: 15, color: '#475569', marginBottom: 6 }}>Choisis le type de compte qui te correspond.</div>
              <div style={{ display: 'grid', gap: 12 }}>
                {[
                  { value: 'acheteur', label: 'Acheteur', description: 'Je veux acheter et suivre mes commandes.' },
                  { value: 'vendeur', label: 'Vendeur', description: 'Je veux vendre mes produits sur ShopCI.' },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => updateField('user_type', option.value)}
                    style={{
                      width: '100%', textAlign: 'left', background: form.user_type === option.value ? '#fff7ed' : '#fff',
                      border: `1px solid ${form.user_type === option.value ? '#fdba74' : '#e5e7eb'}`,
                      borderRadius: 16, padding: '18px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                      cursor: 'pointer', color: '#111827'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 16 }}>{option.label}</div>
                      <div style={{ color: '#6b7280', fontSize: 13, marginTop: 4 }}>{option.description}</div>
                    </div>
                    <div style={{ width: 18, height: 18, borderRadius: '50%', border: '2px solid #f97316', background: form.user_type === option.value ? '#f97316' : '#fff' }} />
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div style={{ display: 'grid', gap: 18 }}>
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 16, padding: 18 }}>
                <div style={{ fontWeight: 800, marginBottom: 8 }}>Résumé</div>
                <div style={{ color: '#475569', lineHeight: 1.8 }}>
                  <div><strong>Nom :</strong> {form.first_name} {form.last_name}</div>
                  <div><strong>Compte :</strong> {form.user_type === 'vendeur' ? 'Vendeur' : 'Acheteur'}</div>
                </div>
              </div>

              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, border: '1px solid #e5e7eb', borderRadius: 14, padding: '14px 16px', cursor: 'pointer', background: form.cgu_accepted ? '#f8fafc' : '#fff' }}>
                <input
                  type="checkbox"
                  checked={form.cgu_accepted}
                  onChange={(e) => updateField('cgu_accepted', e.target.checked)}
                  style={{ marginTop: 3, width: 18, height: 18, accentColor: '#f97316' }}
                />
                <span style={{ color: '#374151', lineHeight: 1.6 }}>
                  J&apos;accepte les <a href="/cgu" target="_blank" rel="noreferrer" style={{ color: '#f97316', fontWeight: 700 }}>CGU</a> et la <a href="/cgu#confidentialite" target="_blank" rel="noreferrer" style={{ color: '#f97316', fontWeight: 700 }}>politique de confidentialité</a> de ShopCI.
                </span>
              </label>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginTop: 30 }}>
            <button
              type="button"
              onClick={handleBack}
              disabled={step === 0 || loading}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, background: '#fff', border: '1px solid #d1d5db', color: '#111827',
                borderRadius: 12, padding: '12px 18px', fontWeight: 700, cursor: step === 0 || loading ? 'not-allowed' : 'pointer', opacity: step === 0 || loading ? 0.6 : 1,
              }}
            >
              <ChevronLeft size={18} /> Retour
            </button>

            {step < 2 ? (
              <button
                type="button"
                onClick={handleNext}
                disabled={!canContinue || loading}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, background: '#f97316', color: '#fff', border: 'none',
                  borderRadius: 12, padding: '12px 20px', fontWeight: 800, cursor: !canContinue || loading ? 'not-allowed' : 'pointer', opacity: !canContinue || loading ? 0.6 : 1,
                }}
              >
                Suivant <ChevronRight size={18} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!canContinue || loading}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, background: '#111827', color: '#fff', border: 'none',
                  borderRadius: 12, padding: '12px 20px', fontWeight: 800, cursor: !canContinue || loading ? 'not-allowed' : 'pointer', opacity: !canContinue || loading ? 0.6 : 1,
                }}
              >
                {loading ? 'Validation…' : 'Terminer'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
