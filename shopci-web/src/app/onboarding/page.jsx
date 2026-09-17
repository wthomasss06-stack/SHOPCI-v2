'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Camera,
  Check,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  UserRound,
  Store,
  Sparkles,
  Upload,
} from 'lucide-react';
import { getImageUrl } from '@/lib/getImageUrl';

const stepTitles = [
  { title: 'Votre identité', icon: UserRound },
  { title: 'Votre photo', icon: Camera },
  { title: 'Type de compte', icon: Store },
  { title: 'Validation', icon: ShieldCheck },
];

const CGU_PREVIEW = `Conditions Générales d'Utilisation — ShopCI

1. Acceptation
En utilisant ShopCI, vous acceptez sans réserve les présentes CGU. Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser la plateforme.

2. Service
ShopCI est une marketplace ivoirienne de mise en relation entre acheteurs et vendeurs. ShopCI agit en intermédiaire technique.

3. Compte utilisateur
Vous devez fournir des informations exactes. Vous êtes responsable de la confidentialité de votre compte et de votre activité sur la plateforme.

4. Vendeurs
Les vendeurs s'engagent à proposer des produits conformes, avec des descriptions et photos authentiques, et à honorer les commandes.

5. Comportements interdits
Fraude, contenu illicite, harcèlement, contournement des systèmes de sécurité et usage frauduleux sont prohibés.

6. Données personnelles
ShopCI traite vos données conformément à sa politique de confidentialité, accessible sur la page CGU du site.

7. Droit applicable
Les présentes CGU sont soumises au droit ivoirien.`;

export default function OnboardingPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const fileInputRef = useRef(null);
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
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
      const googleImage =
        session?.user?.profile_photo_url ||
        session?.user?.profile_photo ||
        session?.user?.image ||
        '';

      setForm((current) => ({
        ...current,
        first_name: current.first_name || firstName || split[0] || '',
        last_name: current.last_name || lastName || split.slice(1).join(' ') || '',
        user_type: current.user_type || session?.user?.user_type || 'acheteur',
      }));

      if (!photoPreview && googleImage) {
        setPhotoPreview(getImageUrl(googleImage) || googleImage);
      }

      if (session?.user?.onboarding_completed) {
        router.replace('/');
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- photoPreview volontairement exclu (init unique)
  }, [status, session, router]);

  const canContinue = useMemo(() => {
    if (step === 0) return form.first_name.trim() && form.last_name.trim();
    if (step === 1) return true;
    if (step === 2) return !!form.user_type;
    return form.cgu_accepted;
  }, [form, step]);

  const updateField = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const handlePhotoPick = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError("L'image ne doit pas dépasser 5 Mo.");
      return;
    }
    if (!file.type.startsWith('image/')) {
      setError('Veuillez sélectionner une image valide.');
      return;
    }
    setError('');
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleNext = () => {
    setError('');
    if (!canContinue) return;
    setStep((current) => Math.min(current + 1, stepTitles.length - 1));
  };

  const handleBack = () => {
    setError('');
    setStep((current) => Math.max(current - 1, 0));
  };

  const handleSubmit = async () => {
    if (!form.cgu_accepted) return;
    setLoading(true);
    setError('');

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
      const fd = new FormData();
      fd.append('first_name', form.first_name.trim());
      fd.append('last_name', form.last_name.trim());
      fd.append('user_type', form.user_type);
      fd.append('cgu_accepted', 'true');
      if (photoFile) fd.append('profile_photo', photoFile);

      const res = await fetch(`${apiUrl}/users/onboarding/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session?.accessToken}`,
        },
        body: fd,
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
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'var(--bg,#f8fafc)', color: 'var(--text,#111827)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontWeight: 600 }}>Chargement…</div>
      </div>
    );
  }

  const CurrentStepIcon = stepTitles[step].icon;
  const isLastStep = step === stepTitles.length - 1;
  const createDisabled = !form.cgu_accepted || loading;

  return (
    <div className="ob-root">
      <style>{`
        .ob-root {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg, #f8fafc);
          color: var(--text, #111827);
          padding: 24px;
          font-family: 'DM Sans', system-ui, sans-serif;
        }
        .ob-card {
          width: 100%;
          max-width: 720px;
          background: var(--card, #fff);
          border: 1px solid var(--border, #e5e7eb);
          border-radius: 28px;
          box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
          overflow: hidden;
        }
        .ob-head {
          background: var(--bg3, #fff7ed);
          border-bottom: 1px solid var(--border, #f3f4f6);
          padding: 28px 32px 20px;
        }
        body.dark .ob-head { background: var(--bg3); }
        .ob-body { padding: 32px; }
        .ob-input {
          width: 100%;
          border: 1px solid var(--border, #d1d5db);
          border-radius: 12px;
          padding: 12px 14px;
          font-size: 15px;
          background: var(--input, #fff);
          color: var(--text, #111827);
        }
        .ob-label { display: block; font-size: 13px; font-weight: 700; margin-bottom: 8px; color: var(--text2, #374151); }
        .ob-cgu-preview {
          max-height: 220px;
          overflow-y: auto;
          padding: 14px 16px;
          border-radius: 12px;
          border: 1px solid var(--border, #e2e8f0);
          background: var(--bg3, #f8fafc);
          font-size: 12.5px;
          line-height: 1.65;
          color: var(--text2, #475569);
          white-space: pre-wrap;
        }
        .ob-btn-create:disabled {
          background: var(--text3, #9ca3af) !important;
          opacity: 1;
          cursor: not-allowed;
        }
        .ob-photo-ring {
          width: 120px;
          height: 120px;
          border-radius: 50%;
          border: 3px solid #f97316;
          overflow: hidden;
          margin: 0 auto 16px;
          background: var(--bg3, #f3f4f6);
          display: grid;
          place-items: center;
        }
        .ob-photo-ring img { width: 100%; height: 100%; object-fit: cover; }
      `}</style>

      <div className="ob-card">
        <div className="ob-head">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 42, height: 42, borderRadius: 14, background: 'rgba(249,115,22,.12)', color: '#f97316', display: 'grid', placeItems: 'center' }}>
                <Sparkles size={20} />
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#f97316', textTransform: 'uppercase', letterSpacing: 1 }}>ShopCI</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)' }}>Bienvenue</div>
              </div>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 700 }}>
              Étape {step + 1} / {stepTitles.length}
            </div>
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
                    background: isDone ? '#f97316' : isActive ? 'rgba(249,115,22,.12)' : 'var(--bg3,#f3f4f6)',
                    color: isDone || isActive ? '#f97316' : 'var(--text3,#9ca3af)',
                    display: 'grid', placeItems: 'center', border: `1px solid ${isDone || isActive ? '#fed7aa' : 'var(--border,#e5e7eb)'}`,
                  }}>
                    {isDone ? <Check size={16} /> : <Icon size={16} />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="ob-body">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(249,115,22,.12)', color: '#f97316', display: 'grid', placeItems: 'center' }}>
              <CurrentStepIcon size={20} />
            </div>
            <h2 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: 'var(--text)' }}>{stepTitles[step].title}</h2>
          </div>

          {error && (
            <div style={{ marginBottom: 20, background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.25)', color: '#dc2626', borderRadius: 12, padding: '12px 14px', fontSize: 14 }}>
              {error}
            </div>
          )}

          {step === 0 && (
            <div style={{ display: 'grid', gap: 18 }}>
              <p style={{ margin: 0, fontSize: 14, color: 'var(--text2)' }}>
                Ton nom est pré-rempli depuis Google. Tu peux le modifier si besoin.
              </p>
              <div>
                <label className="ob-label">Prénom</label>
                <input
                  className="ob-input"
                  value={form.first_name}
                  onChange={(e) => updateField('first_name', e.target.value)}
                  placeholder="Votre prénom"
                />
              </div>
              <div>
                <label className="ob-label">Nom</label>
                <input
                  className="ob-input"
                  value={form.last_name}
                  onChange={(e) => updateField('last_name', e.target.value)}
                  placeholder="Votre nom"
                />
              </div>
            </div>
          )}

          {step === 1 && (
            <div style={{ display: 'grid', gap: 16, textAlign: 'center' }}>
              <p style={{ margin: 0, fontSize: 14, color: 'var(--text2)', lineHeight: 1.6 }}>
                Nous récupérons ta photo Google si elle est disponible. Tu peux aussi en choisir une autre.
              </p>
              <div className="ob-photo-ring">
                {photoPreview ? (
                  <img src={photoPreview} alt="Aperçu profil" />
                ) : (
                  <UserRound size={48} color="var(--text3,#9ca3af)" />
                )}
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoPick} style={{ display: 'none' }} />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  margin: '0 auto', padding: '12px 20px', borderRadius: 12, border: '1px solid var(--border)',
                  background: 'var(--card)', color: 'var(--text)', fontWeight: 700, cursor: 'pointer',
                }}
              >
                <Upload size={18} /> Choisir une photo
              </button>
              <p style={{ margin: 0, fontSize: 12, color: 'var(--text3)' }}>JPG, PNG — max. 5 Mo</p>
            </div>
          )}

          {step === 2 && (
            <div style={{ display: 'grid', gap: 14 }}>
              <div style={{ fontSize: 15, color: 'var(--text2)', marginBottom: 6 }}>Choisis le type de compte qui te correspond.</div>
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
                      width: '100%', textAlign: 'left', background: form.user_type === option.value ? 'rgba(249,115,22,.08)' : 'var(--card)',
                      border: `1px solid ${form.user_type === option.value ? '#fdba74' : 'var(--border,#e5e7eb)'}`,
                      borderRadius: 16, padding: '18px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                      cursor: 'pointer', color: 'var(--text)',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 16 }}>{option.label}</div>
                      <div style={{ color: 'var(--text2)', fontSize: 13, marginTop: 4 }}>{option.description}</div>
                    </div>
                    <div style={{ width: 18, height: 18, borderRadius: '50%', border: '2px solid #f97316', background: form.user_type === option.value ? '#f97316' : 'var(--card)' }} />
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div style={{ display: 'grid', gap: 18 }}>
              <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 16, padding: 18 }}>
                <div style={{ fontWeight: 800, marginBottom: 8, color: 'var(--text)' }}>Récapitulatif</div>
                <div style={{ color: 'var(--text2)', lineHeight: 1.8 }}>
                  <div><strong>Nom :</strong> {form.first_name} {form.last_name}</div>
                  <div><strong>Photo :</strong> {photoPreview ? 'Définie' : 'Photo Google ou par défaut'}</div>
                  <div><strong>Compte :</strong> {form.user_type === 'vendeur' ? 'Vendeur' : 'Acheteur'}</div>
                </div>
              </div>

              <div>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, color: 'var(--text)' }}>Aperçu des CGU</div>
                <div className="ob-cgu-preview" role="region" aria-label="Aperçu des conditions générales">
                  {CGU_PREVIEW}
                </div>
                <p style={{ margin: '8px 0 0', fontSize: 12, color: 'var(--text3)' }}>
                  <a href="/cgu" target="_blank" rel="noreferrer" style={{ color: '#f97316', fontWeight: 700 }}>Lire les CGU complètes</a>
                  {' · '}
                  <a href="/cgu#confidentialite" target="_blank" rel="noreferrer" style={{ color: '#f97316', fontWeight: 700 }}>Confidentialité</a>
                </p>
              </div>

              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, border: '1px solid var(--border)', borderRadius: 14, padding: '14px 16px', cursor: 'pointer', background: form.cgu_accepted ? 'var(--bg3)' : 'var(--card)' }}>
                <input
                  type="checkbox"
                  checked={form.cgu_accepted}
                  onChange={(e) => updateField('cgu_accepted', e.target.checked)}
                  style={{ marginTop: 3, width: 18, height: 18, accentColor: '#f97316' }}
                />
                <span style={{ color: 'var(--text2)', lineHeight: 1.6 }}>
                  J&apos;accepte les CGU et la politique de confidentialité de ShopCI.
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
                display: 'flex', alignItems: 'center', gap: 8, background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--text)',
                borderRadius: 12, padding: '12px 18px', fontWeight: 700, cursor: step === 0 || loading ? 'not-allowed' : 'pointer', opacity: step === 0 || loading ? 0.6 : 1,
              }}
            >
              <ChevronLeft size={18} /> Retour
            </button>

            {!isLastStep ? (
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
                className="ob-btn-create"
                onClick={handleSubmit}
                disabled={createDisabled}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, background: '#111827', color: '#fff', border: 'none',
                  borderRadius: 12, padding: '12px 20px', fontWeight: 800, cursor: createDisabled ? 'not-allowed' : 'pointer',
                }}
              >
                {loading ? 'Création…' : 'Créer mon compte'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
