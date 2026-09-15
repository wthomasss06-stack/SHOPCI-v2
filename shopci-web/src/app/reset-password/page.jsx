'use client';

// ecommerce-frontend/src/pages/ResetPasswordPage.jsx

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, AlertCircle, CheckCircle, Eye, EyeOff, X, ShieldCheck } from 'lucide-react';
import { authAPI } from '@/services/api';

/* ── Logo inline ShopCI ── */
function LogoShopCI({ size = 32 }) {
  return (
    <svg viewBox="0 0 140 34" height={size} fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="34" height="34" rx="8" fill="#f97316"/>
      <path d="M7 11h3l3.5 10h8.5l3-8H11" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="14.5" cy="24.5" r="1.5" fill="white"/>
      <circle cx="21" cy="24.5" r="1.5" fill="white"/>
      <text x="42" y="25" fontFamily="'DM Sans',sans-serif" fontSize="20" fontWeight="800" fill="#1a1a1a" letterSpacing="-0.5">Shop</text>
      <text x="91" y="25" fontFamily="'DM Sans',sans-serif" fontSize="20" fontWeight="800" fill="#f97316" letterSpacing="-0.5">CI</text>
    </svg>
  );
}

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
  .shopci-auth * { font-family: 'DM Sans', sans-serif; box-sizing: border-box; }

  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    10%, 30%, 50%, 70%, 90% { transform: translateX(-8px); }
    20%, 40%, 60%, 80% { transform: translateX(8px); }
  }
  @keyframes fadeSlideIn {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes successPop {
    0%   { transform: scale(0.6); opacity: 0; }
    70%  { transform: scale(1.08); }
    100% { transform: scale(1); opacity: 1; }
  }

  .shake-animation  { animation: shake 0.5s ease-in-out; }
  .auth-card        { animation: fadeSlideIn 0.5s ease-out both; }
  .success-icon     { animation: successPop 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) both; }

  .auth-input {
    width: 100%;
    padding: 13px 16px 13px 46px;
    background: #fafafa;
    border: 1.5px solid #e5e7eb;
    border-radius: 12px;
    font-size: 15px;
    color: #1a1a1a;
    transition: border-color .2s, box-shadow .2s, background .2s;
    outline: none;
    font-family: 'DM Sans', sans-serif;
  }
  .auth-input:focus {
    border-color: #f97316;
    background: #fff;
    box-shadow: 0 0 0 4px rgba(249,115,22,0.1);
  }
  .auth-input::placeholder { color: #9ca3af; }
  .auth-input.error { border-color: #ef4444; background: #fff5f5; }

  .auth-btn-primary {
    width: 100%;
    background: #f97316;
    color: white;
    border: none;
    border-radius: 12px;
    padding: 14px 24px;
    font-size: 16px;
    font-weight: 700;
    cursor: pointer;
    transition: background .2s, transform .15s, box-shadow .2s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    font-family: 'DM Sans', sans-serif;
    box-shadow: 0 4px 14px rgba(249,115,22,0.35);
  }
  .auth-btn-primary:hover:not(:disabled) {
    background: #ea6a0a;
    transform: translateY(-1px);
    box-shadow: 0 6px 20px rgba(249,115,22,0.45);
  }
  .auth-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

  .auth-label {
    display: block;
    font-size: 13px;
    font-weight: 600;
    color: #374151;
    margin-bottom: 6px;
    letter-spacing: 0.01em;
  }
  .auth-back-link {
    color: #6b7280;
    font-size: 13px;
    background: none;
    border: none;
    cursor: pointer;
    font-family: 'DM Sans', sans-serif;
    padding: 0;
    transition: color .15s;
  }
  .auth-back-link:hover { color: #1a1a1a; }

  .strength-bar-fill { transition: width .3s ease; }

  .req-item {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: #9ca3af;
    transition: color .2s;
  }
  .req-item.met { color: #22c55e; }
  .req-dot {
    width: 6px; height: 6px;
    border-radius: 50%;
    background: #e5e7eb;
    flex-shrink: 0;
    transition: background .2s;
  }
  .req-item.met .req-dot { background: #22c55e; }
`;

function ResetPasswordPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const uid = searchParams.get('uid');

  const [formData, setFormData] = useState({ password: '', password2: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, message: '', color: '' });

  const evaluatePasswordStrength = (password) => {
    if (!password) { setPasswordStrength({ score: 0, message: '', color: '' }); return; }
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;
    if (!/^\d+$/.test(password)) score++;
    const msg = score <= 2 ? 'Faible' : score <= 4 ? 'Moyen' : 'Fort';
    const color = score <= 2 ? '#ef4444' : score <= 4 ? '#f59e0b' : '#22c55e';
    setPasswordStrength({ score, message: msg, color });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (name === 'password') evaluatePasswordStrength(value);
    if (errors[name]) setErrors({ ...errors, [name]: '' });
    if (errors.general) setErrors({ ...errors, general: '' });
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.password || formData.password.length < 8) newErrors.password = 'Le mot de passe doit contenir au moins 8 caractères';
    else if (/^\d+$/.test(formData.password)) newErrors.password = 'Le mot de passe ne peut pas être entièrement numérique';
    else if (passwordStrength.score < 3) newErrors.password = 'Le mot de passe est trop faible';
    if (formData.password !== formData.password2) newErrors.password2 = 'Les mots de passe ne correspondent pas';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    if (!token || !uid) { setErrors({ general: 'Lien invalide ou expiré' }); return; }
    setLoading(true);
    try {
      await authAPI.resetPassword({ token, uid, new_password: formData.password });
      setSuccess(true);
    } catch (err) {
      let errorMsg = 'Erreur lors de la réinitialisation';
      if (err.response?.data) {
        const errorData = err.response.data;
        const errorMessages = {
          'Invalid token': 'Lien invalide ou expiré',
          'Token has expired': 'Le lien a expiré',
          'password_too_common': 'Ce mot de passe est trop courant',
          'password_entirely_numeric': 'Le mot de passe ne peut pas être entièrement numérique',
        };
        let msg = errorData.error || errorData.detail;
        if (msg) {
          Object.keys(errorMessages).forEach(p => { if (msg.includes(p)) msg = errorMessages[p]; });
          errorMsg = msg;
        }
      } else if (err.request) {
        errorMsg = 'Erreur de connexion au serveur';
      }
      setErrors({ general: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  const reqs = [
    { label: 'Au moins 8 caractères',   met: formData.password.length >= 8 },
    { label: 'Une majuscule',            met: /[A-Z]/.test(formData.password) },
    { label: 'Un chiffre',               met: /[0-9]/.test(formData.password) },
    { label: 'Un caractère spécial',     met: /[!@#$%^&*(),.?":{}|<>]/.test(formData.password) },
  ];

  const strengthPct = Math.round((passwordStrength.score / 6) * 100);

  /* ── Success state ── */
  if (success) return (
    <>
      <style>{styles}</style>
      <div className="shopci-auth" style={{
        minHeight:'100vh', background:'linear-gradient(135deg, #fff7ed 0%, #fafafa 50%, #fff7ed 100%)',
        display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
        padding:'24px 16px', position:'relative', overflow:'hidden',
      }}>
        <div style={{ position:'absolute', top:'-80px', right:'-80px', width:'320px', height:'320px', background:'#f97316', opacity:0.06, borderRadius:'50%' }}/>
        <div style={{ position:'absolute', bottom:'-60px', left:'-60px', width:'240px', height:'240px', background:'#f97316', opacity:0.06, borderRadius:'50%' }}/>

        <div style={{ marginBottom:'24px' }}>
          <button onClick={() => router.push('/')} style={{ background:'none', border:'none', cursor:'pointer', padding:0 }}>
            <LogoShopCI size={36} />
          </button>
        </div>

        <div className="auth-card" style={{
          background:'#fff', borderRadius:'24px',
          boxShadow:'0 8px 40px rgba(0,0,0,0.08)', width:'100%', maxWidth:'400px',
          padding:'48px 36px', border:'1px solid #f3f4f6', textAlign:'center',
        }}>
          <div className="success-icon" style={{
            display:'inline-flex', alignItems:'center', justifyContent:'center',
            width:'72px', height:'72px',
            background:'linear-gradient(135deg, #f97316, #fb923c)',
            borderRadius:'50%', marginBottom:'20px',
            boxShadow:'0 8px 24px rgba(249,115,22,0.4)',
          }}>
            <CheckCircle size={36} color="white" />
          </div>
          <h2 style={{ fontSize:'24px', fontWeight:'800', color:'#1a1a1a', margin:'0 0 10px', letterSpacing:'-0.5px' }}>
            Mot de passe réinitialisé !
          </h2>
          <p style={{ fontSize:'14px', color:'#6b7280', marginBottom:'28px', lineHeight:'1.6' }}>
            Votre mot de passe a été mis à jour avec succès. Vous pouvez maintenant vous connecter.
          </p>
          <button className="auth-btn-primary" onClick={() => router.push('/login')}>
            Se connecter →
          </button>
          <div style={{ marginTop:'16px' }}>
            <button className="auth-back-link" onClick={() => router.push('/')}>← Retour à l'accueil</button>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <>
      <style>{styles}</style>
      <div className="shopci-auth" style={{
        minHeight:'100vh', background:'linear-gradient(135deg, #fff7ed 0%, #fafafa 50%, #fff7ed 100%)',
        display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
        padding:'24px 16px', position:'relative', overflow:'hidden',
      }}>
        <div style={{ position:'absolute', top:'-80px', right:'-80px', width:'320px', height:'320px', background:'#f97316', opacity:0.06, borderRadius:'50%' }}/>
        <div style={{ position:'absolute', bottom:'-60px', left:'-60px', width:'240px', height:'240px', background:'#f97316', opacity:0.06, borderRadius:'50%' }}/>

        {/* Logo */}
        <div style={{ marginBottom:'24px' }}>
          <button onClick={() => router.push('/')} style={{ background:'none', border:'none', cursor:'pointer', padding:0 }}>
            <LogoShopCI size={36} />
          </button>
        </div>

        {/* Card */}
        <div className="auth-card" style={{
          background:'#fff', borderRadius:'24px',
          boxShadow:'0 8px 40px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.04)',
          width:'100%', maxWidth:'420px', padding:'40px 36px', border:'1px solid #f3f4f6',
        }}>
          {/* Header */}
          <div style={{ textAlign:'center', marginBottom:'28px' }}>
            <div style={{
              display:'inline-flex', alignItems:'center', justifyContent:'center',
              width:'60px', height:'60px',
              background:'linear-gradient(135deg, #f97316, #fb923c)',
              borderRadius:'16px', marginBottom:'16px',
              boxShadow:'0 4px 16px rgba(249,115,22,0.35)',
            }}>
              <ShieldCheck size={28} color="white" />
            </div>
            <h1 style={{ fontSize:'26px', fontWeight:'800', color:'#1a1a1a', margin:'0 0 6px', letterSpacing:'-0.5px' }}>
              Nouveau mot de passe
            </h1>
            <p style={{ fontSize:'14px', color:'#6b7280', margin:0 }}>
              Créez un mot de passe fort et sécurisé
            </p>
          </div>

          {/* Error alert */}
          {errors.general && (
            <div style={{ background:'#fff5f5', border:'1.5px solid #fecaca', borderRadius:'12px', padding:'12px 16px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:'8px', marginBottom:'20px' }} className="shake-animation">
              <div style={{ display:'flex', alignItems:'center', gap:'10px', flex:1 }}>
                <AlertCircle size={16} color="#ef4444" style={{ flexShrink:0 }} />
                <span style={{ fontSize:'13px', color:'#dc2626' }}>{errors.general}</span>
              </div>
              <button onClick={() => setErrors({ ...errors, general: '' })} style={{ background:'none', border:'none', cursor:'pointer', color:'#ef4444', display:'flex' }}>
                <X size={14} />
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:'20px' }}>
            {/* New password */}
            <div>
              <label className="auth-label">Nouveau mot de passe</label>
              <div style={{ position:'relative' }}>
                <Lock size={18} color={errors.password ? '#ef4444' : '#9ca3af'} style={{ position:'absolute', left:'14px', top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`auth-input${errors.password ? ' error' : ''}`}
                  style={{ paddingRight:'46px' }}
                  placeholder="••••••••"
                  required
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position:'absolute', right:'14px', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#9ca3af', display:'flex' }}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {/* Strength bar */}
              {formData.password && (
                <div style={{ marginTop:'10px' }}>
                  <div style={{ height:'4px', background:'#e5e7eb', borderRadius:'4px', overflow:'hidden', marginBottom:'8px' }}>
                    <div className="strength-bar-fill" style={{ height:'100%', width:`${strengthPct}%`, background: passwordStrength.color, borderRadius:'4px' }} />
                  </div>
                  {passwordStrength.message && (
                    <p style={{ fontSize:'12px', color: passwordStrength.color, fontWeight:'600', margin:'0 0 8px' }}>
                      Force : {passwordStrength.message}
                    </p>
                  )}
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'4px' }}>
                    {reqs.map(r => (
                      <div key={r.label} className={`req-item${r.met ? ' met' : ''}`}>
                        <div className="req-dot" />
                        {r.label}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {errors.password && <p style={{ color:'#ef4444', fontSize:'12px', marginTop:'6px' }} className="shake-animation">{errors.password}</p>}
            </div>

            {/* Confirm password */}
            <div>
              <label className="auth-label">Confirmer le mot de passe</label>
              <div style={{ position:'relative' }}>
                <Lock size={18} color={errors.password2 ? '#ef4444' : '#9ca3af'} style={{ position:'absolute', left:'14px', top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }} />
                <input
                  type={showPassword2 ? 'text' : 'password'}
                  name="password2"
                  value={formData.password2}
                  onChange={handleChange}
                  className={`auth-input${errors.password2 ? ' error' : ''}`}
                  style={{ paddingRight:'76px' }}
                  placeholder="••••••••"
                  required
                />
                <div style={{ position:'absolute', right:'14px', top:'50%', transform:'translateY(-50%)', display:'flex', alignItems:'center', gap:'6px' }}>
                  {!errors.password2 && formData.password2 && formData.password === formData.password2 && (
                    <CheckCircle size={18} color="#22c55e" />
                  )}
                  <button type="button" onClick={() => setShowPassword2(!showPassword2)} style={{ background:'none', border:'none', cursor:'pointer', color:'#9ca3af', display:'flex' }}>
                    {showPassword2 ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              {errors.password2 && <p style={{ color:'#ef4444', fontSize:'12px', marginTop:'6px' }} className="shake-animation">{errors.password2}</p>}
            </div>

            <button type="submit" className="auth-btn-primary" disabled={loading} style={{ marginTop:'4px' }}>
              {loading ? (
                <>
                  <svg className="animate-spin" style={{ width:'18px', height:'18px' }} viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Réinitialisation…
                </>
              ) : (
                <><ShieldCheck size={18} /> Réinitialiser le mot de passe</>
              )}
            </button>
          </form>

          <div style={{ textAlign:'center', marginTop:'20px' }}>
            <button className="auth-back-link" onClick={() => router.push('/login')}>
              ← Retour à la connexion
            </button>
          </div>
        </div>

        {/* Trust badges */}
        <div style={{ marginTop:'24px', display:'flex', gap:'20px', alignItems:'center', flexWrap:'wrap', justifyContent:'center' }}>
          {['🔒 Connexion sécurisée', '🛡️ Données protégées'].map(badge => (
            <span key={badge} style={{ fontSize:'12px', color:'#9ca3af' }}>{badge}</span>
          ))}
        </div>
      </div>
    </>
  );
}

// Next.js exige un Suspense autour de tout composant utilisant useSearchParams
// pendant le rendu statique — wrapper mécanique, ResetPasswordPageInner ci-dessus
// est resté strictement identique à l'original.
export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordPageInner />
    </Suspense>
  );
}
