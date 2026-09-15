'use client';

// ecommerce-frontend/src/pages/RegisterPage.jsx

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  UserPlus, User, Mail, Lock, Phone, MapPin, ShoppingBag, Store,
  AlertCircle, CheckCircle, Eye, EyeOff, FileText, ArrowRight, X
} from 'lucide-react';
import { authAPI } from '../services/api';

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
  @keyframes wiggle {
    0%, 100% { transform: rotate(0deg); }
    25% { transform: rotate(-5deg); }
    75% { transform: rotate(5deg); }
  }
  @keyframes bounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-6px); }
  }

  .shake-animation  { animation: shake 0.5s ease-in-out; }
  .wiggle-animation { animation: wiggle 0.5s ease-in-out; }
  .bounce-icon      { animation: bounce 0.6s ease-in-out infinite; }
  .auth-card        { animation: fadeSlideIn 0.5s ease-out both; }

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
  .auth-input-sm {
    width: 100%;
    padding: 11px 14px 11px 42px;
    background: #fafafa;
    border: 1.5px solid #e5e7eb;
    border-radius: 12px;
    font-size: 14px;
    color: #1a1a1a;
    transition: border-color .2s, box-shadow .2s, background .2s;
    outline: none;
    font-family: 'DM Sans', sans-serif;
  }
  .auth-input-sm:focus {
    border-color: #f97316;
    background: #fff;
    box-shadow: 0 0 0 4px rgba(249,115,22,0.1);
  }
  .auth-input-sm::placeholder { color: #9ca3af; }
  .auth-input-sm.error { border-color: #ef4444; }

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

  .auth-btn-secondary {
    background: #f9fafb;
    color: #6b7280;
    border: 1.5px solid #e5e7eb;
    border-radius: 12px;
    padding: 13px 24px;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    transition: background .2s, color .2s;
    font-family: 'DM Sans', sans-serif;
  }
  .auth-btn-secondary:hover { background: #f3f4f6; color: #374151; }

  .auth-label {
    display: block;
    font-size: 13px;
    font-weight: 600;
    color: #374151;
    margin-bottom: 6px;
    letter-spacing: 0.01em;
  }

  .auth-link {
    color: #f97316;
    font-weight: 600;
    background: none;
    border: none;
    cursor: pointer;
    font-family: 'DM Sans', sans-serif;
    font-size: inherit;
    padding: 0;
    transition: color .15s;
  }
  .auth-link:hover { color: #ea6a0a; text-decoration: underline; }

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

  .type-card {
    padding: 20px 16px;
    border-radius: 16px;
    border: 2px solid #e5e7eb;
    background: #fafafa;
    cursor: pointer;
    transition: all .2s;
    text-align: center;
  }
  .type-card:hover { border-color: #f97316; background: #fff7ed; }
  .type-card.selected { border-color: #f97316; background: #fff7ed; box-shadow: 0 0 0 4px rgba(249,115,22,0.1); }

  .terms-box {
    height: 280px;
    overflow-y: auto;
    background: #f9fafb;
    border: 1.5px solid #e5e7eb;
    border-radius: 12px;
    padding: 16px 20px;
    font-size: 13px;
    color: #6b7280;
    line-height: 1.6;
  }
  .terms-box::-webkit-scrollbar { width: 6px; }
  .terms-box::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 6px; }
  .terms-box::-webkit-scrollbar-thumb { background: #f97316; border-radius: 6px; }

  .strength-bar-fill { transition: width .3s ease; }

  .step-indicator {
    display: flex;
    align-items: center;
    gap: 0;
    margin: 16px 0 4px;
  }
  .step-dot {
    width: 28px; height: 28px;
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 12px; font-weight: 700;
    flex-shrink: 0;
    transition: all .25s;
  }
  .step-dot.active   { background: #f97316; color: #fff; box-shadow: 0 0 0 4px rgba(249,115,22,0.2); }
  .step-dot.done     { background: #f97316; color: #fff; }
  .step-dot.inactive { background: #e5e7eb; color: #9ca3af; }
  .step-line { flex: 1; height: 2px; transition: background .25s; }
  .step-line.done    { background: #f97316; }
  .step-line.inactive{ background: #e5e7eb; }
`;

const ConditionsGenerales = () => (
  <div className="terms-box">
    <h3 style={{ fontSize:'14px', fontWeight:'700', color:'#f97316', marginBottom:'12px', borderBottom:'1px solid #e5e7eb', paddingBottom:'8px' }}>
      Conditions Générales – ShopCI
    </h3>
    <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
      {[
        { title:'1. Présentation de ShopCI', body:'ShopCI est une plateforme en ligne permettant la mise en relation entre vendeurs et acheteurs pour l\'achat de divers produits. Notre objectif est de faciliter l\'accès à une large gamme d\'articles proposés par des vendeurs indépendants.' },
        { title:'2. Rôle de ShopCI', body:'ShopCI n\'est ni vendeur, ni acheteur, ni propriétaire des produits listés. Nous ne stockons aucun article et n\'intervenons pas en tant qu\'intermédiaire officiel dans les transactions. Nous mettons simplement à disposition un espace permettant aux vendeurs de publier leurs produits.' },
        { title:'3. Limites de responsabilité', body:'ShopCI ne peut être tenu responsable des fraudes, de la qualité des produits vendus, d\'un litige entre vendeur et acheteur, d\'un paiement effectué en dehors des procédures sécurisées, ou de tout dommage résultant d\'une transaction entre utilisateurs.' },
        { title:'4. Engagements des utilisateurs', body:'En utilisant ShopCI, vous vous engagez à fournir des informations exactes, ne pas publier de produits illégaux ou dangereux, respecter les lois en vigueur et agir avec honnêteté lors des achats et ventes.' },
        { title:'5. Traitement des données', body:'ShopCI collecte uniquement les données nécessaires à la création de compte et la mise en relation. Vos informations sont traitées de manière confidentielle et ne sont jamais revendues.' },
      ].map(({ title, body }) => (
        <div key={title}>
          <p style={{ fontWeight:'700', color:'#374151', marginBottom:'4px', fontSize:'13px' }}>{title}</p>
          <p style={{ margin:0 }}>{body}</p>
        </div>
      ))}
    </div>
  </div>
);

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    username: '', email: '', password: '', password2: '',
    phone: '', address: '', user_type: 'acheteur'
  });
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, message: '', color: '' });
  const [statusMessage, setStatusMessage] = useState({ type: null, text: '' });
  const [shakeIcon, setShakeIcon] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (name === 'password') evaluatePasswordStrength(value);
    if (errors[name]) setErrors({ ...errors, [name]: '' });
    if (statusMessage.type) setStatusMessage({ type: null, text: '' });
  };

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

  const validate = () => {
    const newErrors = {};
    if (!formData.username || formData.username.length < 3) newErrors.username = 'Min. 3 caractères requis';
    if (!formData.email || !/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email invalide';
    if (!formData.password || formData.password.length < 8) newErrors.password = 'Min. 8 caractères requis';
    else if (/^\d+$/.test(formData.password)) newErrors.password = 'Le mot de passe ne peut pas être entièrement numérique';
    else if (passwordStrength.score < 3) newErrors.password = 'Mot de passe trop faible';
    if (formData.password !== formData.password2) newErrors.password2 = 'Les mots de passe ne correspondent pas';
    if (!formData.phone || formData.phone.length < 10) newErrors.phone = 'Numéro de téléphone invalide';
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) { setShakeIcon(true); setTimeout(() => setShakeIcon(false), 500); }
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    setLoading(true);
    setErrors({});
    try {
      await authAPI.register(formData);
      setStatusMessage({ type: 'success', text: 'Compte créé avec succès ! Redirection vers la connexion…' });
      setTimeout(() => router.push('/login'), 3000);
    } catch (err) {
      let generalError = 'Erreur lors de l\'inscription. Veuillez réessayer.';
      if (err.response?.data) {
        const apiErrors = err.response.data;
        const newErrors = {};
        const errorMessages = {
          'A user with that username already exists.': 'Ce nom d\'utilisateur existe déjà.',
          'user with this email already exists.': 'Cet email est déjà utilisé.',
          'password_too_common': 'Ce mot de passe est trop courant.',
          'password_entirely_numeric': 'Le mot de passe ne peut pas être entièrement numérique.',
        };
        Object.keys(apiErrors).forEach(key => {
          if (Array.isArray(apiErrors[key])) {
            apiErrors[key].forEach(error => {
              const errorStr = typeof error === 'object' ? error.message || error.string : error;
              let translated = errorStr;
              Object.keys(errorMessages).forEach(p => { if (errorStr.includes(p)) translated = errorMessages[p]; });
              newErrors[key] = translated;
            });
          } else { newErrors[key] = apiErrors[key]; }
        });
        setErrors(newErrors);
        if (Object.keys(newErrors).length > 0) generalError = 'Veuillez corriger les erreurs ci-dessous.';
      }
      setStatusMessage({ type: 'error', text: generalError });
      setShakeIcon(true);
      setTimeout(() => setShakeIcon(false), 500);
    } finally {
      setLoading(false);
    }
  };

  const handleNextStep = () => {
    if (statusMessage.type) setStatusMessage({ type: null, text: '' });
    if (step === 1 && formData.user_type) { setErrors({}); setStep(2); }
    else if (step === 2 && acceptedTerms) { setErrors({}); setStep(3); }
    else if (step === 3 && validate()) { handleSubmit(); }
  };

  const stepTitles = ['Type de compte', 'Conditions', 'Vos informations'];
  const stepIcons = [<UserPlus size={24} />, <FileText size={24} />, <UserPlus size={24} />];

  const PasswordStrengthBar = () => {
    if (!formData.password) return null;
    const pct = Math.round((passwordStrength.score / 6) * 100);
    return (
      <div style={{ marginTop:'8px' }}>
        <div style={{ height:'4px', background:'#e5e7eb', borderRadius:'4px', overflow:'hidden' }}>
          <div className="strength-bar-fill" style={{ height:'100%', width:`${pct}%`, background: passwordStrength.color, borderRadius:'4px' }} />
        </div>
        {passwordStrength.message && (
          <p style={{ fontSize:'12px', color: passwordStrength.color, marginTop:'4px', fontWeight:'600' }}>
            Force : {passwordStrength.message}
          </p>
        )}
      </div>
    );
  };

  const renderStep = () => {
    if (step === 1) return (
      <div>
        <p className="auth-label" style={{ marginBottom:'12px' }}>Je veux m'inscrire en tant que :</p>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
          {[
            { value:'acheteur', icon:<ShoppingBag size={28}/>, label:'Acheteur', sub:"J'achète des produits" },
            { value:'vendeur',  icon:<Store size={28}/>, label:'Vendeur', sub:"Je vends des produits" },
          ].map(({ value, icon, label, sub }) => (
            <div key={value} className={`type-card${formData.user_type === value ? ' selected' : ''}`}
              onClick={() => setFormData({ ...formData, user_type: value })}>
              <div style={{ color: formData.user_type === value ? '#f97316' : '#9ca3af', marginBottom:'8px', display:'flex', justifyContent:'center' }}
                className={formData.user_type === value ? 'bounce-icon' : ''}>{icon}</div>
              <div style={{ fontWeight:'700', color:'#1a1a1a', fontSize:'15px' }}>{label}</div>
              <div style={{ fontSize:'12px', color:'#9ca3af', marginTop:'2px' }}>{sub}</div>
            </div>
          ))}
        </div>
      </div>
    );

    if (step === 2) return (
      <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
        <ConditionsGenerales />
        <label style={{ display:'flex', alignItems:'flex-start', gap:'10px', cursor:'pointer' }}>
          <input type="checkbox" checked={acceptedTerms} onChange={e => setAcceptedTerms(e.target.checked)}
            style={{ width:'16px', height:'16px', accentColor:'#f97316', marginTop:'2px', flexShrink:0 }} />
          <span style={{ fontSize:'13px', color:'#6b7280', lineHeight:'1.5' }}>
            J'ai lu et j'accepte les <span style={{ color:'#f97316', fontWeight:'600' }}>conditions d'utilisation</span> et la politique de confidentialité de ShopCI.
          </span>
        </label>
      </div>
    );

    if (step === 3) return (
      <div style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
        {/* Username */}
        <div>
          <label className="auth-label">Nom d'utilisateur *</label>
          <div style={{ position:'relative' }}>
            <User size={17} color={errors.username ? '#ef4444' : '#9ca3af'} className={errors.username ? 'wiggle-animation' : ''} style={{ position:'absolute', left:'13px', top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }} />
            <input type="text" name="username" value={formData.username} onChange={handleChange}
              className={`auth-input${errors.username ? ' error' : ''}`} placeholder="Choisissez un nom d'utilisateur" />
            {!errors.username && formData.username.length >= 3 && (
              <CheckCircle size={17} color="#22c55e" style={{ position:'absolute', right:'13px', top:'50%', transform:'translateY(-50%)' }} />
            )}
          </div>
          {errors.username && <p style={{ color:'#ef4444', fontSize:'12px', marginTop:'4px' }} className="shake-animation">{errors.username}</p>}
        </div>

        {/* Email */}
        <div>
          <label className="auth-label">Email *</label>
          <div style={{ position:'relative' }}>
            <Mail size={17} color={errors.email ? '#ef4444' : '#9ca3af'} className={errors.email ? 'wiggle-animation' : ''} style={{ position:'absolute', left:'13px', top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }} />
            <input type="email" name="email" value={formData.email} onChange={handleChange}
              className={`auth-input${errors.email ? ' error' : ''}`} placeholder="votre.email@exemple.com" />
            {!errors.email && /\S+@\S+\.\S+/.test(formData.email) && (
              <CheckCircle size={17} color="#22c55e" style={{ position:'absolute', right:'13px', top:'50%', transform:'translateY(-50%)' }} />
            )}
          </div>
          {errors.email && <p style={{ color:'#ef4444', fontSize:'12px', marginTop:'4px' }} className="shake-animation">{errors.email}</p>}
        </div>

        {/* Phone */}
        <div>
          <label className="auth-label">Téléphone *</label>
          <div style={{ position:'relative' }}>
            <Phone size={17} color={errors.phone ? '#ef4444' : '#9ca3af'} className={errors.phone ? 'wiggle-animation' : ''} style={{ position:'absolute', left:'13px', top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }} />
            <input type="tel" name="phone" value={formData.phone} onChange={handleChange}
              className={`auth-input${errors.phone ? ' error' : ''}`} placeholder="+225 07 12 34 56 78" />
          </div>
          {errors.phone && <p style={{ color:'#ef4444', fontSize:'12px', marginTop:'4px' }} className="shake-animation">{errors.phone}</p>}
        </div>

        {/* Address */}
        <div>
          <label className="auth-label">Adresse</label>
          <div style={{ position:'relative' }}>
            <MapPin size={17} color="#9ca3af" style={{ position:'absolute', left:'13px', top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }} />
            <input type="text" name="address" value={formData.address} onChange={handleChange}
              className="auth-input" placeholder="Cocody, Abidjan" />
          </div>
        </div>

        {/* Passwords side by side */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
          <div>
            <label className="auth-label">Mot de passe *</label>
            <div style={{ position:'relative' }}>
              <Lock size={16} color={errors.password ? '#ef4444' : '#9ca3af'} style={{ position:'absolute', left:'12px', top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }} />
              <input type={showPassword ? 'text' : 'password'} name="password" value={formData.password} onChange={handleChange}
                className={`auth-input-sm${errors.password ? ' error' : ''}`} style={{ paddingRight:'38px' }} placeholder="••••••••" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position:'absolute', right:'10px', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#9ca3af', display:'flex' }}>
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <PasswordStrengthBar />
            {errors.password && <p style={{ color:'#ef4444', fontSize:'11px', marginTop:'4px' }} className="shake-animation">{errors.password}</p>}
          </div>

          <div>
            <label className="auth-label">Confirmer *</label>
            <div style={{ position:'relative' }}>
              <Lock size={16} color={errors.password2 ? '#ef4444' : '#9ca3af'} style={{ position:'absolute', left:'12px', top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }} />
              <input type={showPassword2 ? 'text' : 'password'} name="password2" value={formData.password2} onChange={handleChange}
                className={`auth-input-sm${errors.password2 ? ' error' : ''}`} style={{ paddingRight:'38px' }} placeholder="••••••••" />
              <button type="button" onClick={() => setShowPassword2(!showPassword2)} style={{ position:'absolute', right:'10px', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#9ca3af', display:'flex' }}>
                {showPassword2 ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
              {!errors.password2 && formData.password2 && formData.password === formData.password2 && (
                <CheckCircle size={15} color="#22c55e" style={{ position:'absolute', right:'34px', top:'50%', transform:'translateY(-50%)' }} />
              )}
            </div>
            {errors.password2 && <p style={{ color:'#ef4444', fontSize:'11px', marginTop:'4px' }} className="shake-animation">{errors.password2}</p>}
          </div>
        </div>
        <p style={{ fontSize:'12px', color:'#9ca3af', margin:0 }}>
          Min. 8 caractères, majuscules, minuscules, chiffres et symboles
        </p>
      </div>
    );
  };

  const btnDisabled = (step === 1 && !formData.user_type)
    || (step === 2 && !acceptedTerms)
    || (step === 3 && loading);

  return (
    <>
      <style>{styles}</style>
      <div className="shopci-auth" style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #fff7ed 0%, #fafafa 50%, #fff7ed 100%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '24px 16px', position: 'relative', overflow: 'hidden',
      }}>
        {/* Background deco */}
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
          background: '#fff', borderRadius: '24px',
          boxShadow: '0 8px 40px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.04)',
          width: '100%', maxWidth: step === 3 ? '520px' : '440px',
          padding: '36px 32px', border: '1px solid #f3f4f6',
        }}>
          {/* Header */}
          <div style={{ textAlign:'center', marginBottom:'8px' }}>
            <div style={{
              display:'inline-flex', alignItems:'center', justifyContent:'center',
              width:'54px', height:'54px',
              background:'linear-gradient(135deg, #f97316, #fb923c)',
              borderRadius:'14px', marginBottom:'12px',
              boxShadow:'0 4px 16px rgba(249,115,22,0.35)',
            }} className={shakeIcon ? 'shake-animation' : ''}>
              {stepIcons[step - 1]}
            </div>
            <h1 style={{ fontSize:'24px', fontWeight:'800', color:'#1a1a1a', margin:'0 0 4px', letterSpacing:'-0.5px' }}>
              {stepTitles[step - 1]}
            </h1>
            <p style={{ fontSize:'13px', color:'#9ca3af', margin:0 }}>Étape {step} sur 3</p>

            {/* Step indicator */}
            <div className="step-indicator">
              {[1,2,3].map((s, i) => (
                <React.Fragment key={s}>
                  <div className={`step-dot ${s < step ? 'done' : s === step ? 'active' : 'inactive'}`}>
                    {s < step ? '✓' : s}
                  </div>
                  {i < 2 && <div className={`step-line ${s < step ? 'done' : 'inactive'}`} />}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Alerts */}
          {statusMessage.type === 'error' && (
            <div style={{ background:'#fff5f5', border:'1.5px solid #fecaca', borderRadius:'12px', padding:'12px 16px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:'8px', marginBottom:'16px' }} className="shake-animation">
              <div style={{ display:'flex', alignItems:'center', gap:'10px', flex:1 }}>
                <AlertCircle size={16} color="#ef4444" style={{ flexShrink:0 }} />
                <span style={{ fontSize:'13px', color:'#dc2626' }}>{statusMessage.text}</span>
              </div>
              <button onClick={() => setStatusMessage({ type:null, text:'' })} style={{ background:'none', border:'none', cursor:'pointer', color:'#ef4444', display:'flex' }}>
                <X size={14} />
              </button>
            </div>
          )}
          {statusMessage.type === 'success' && (
            <div style={{ background:'#f0fdf4', border:'1.5px solid #bbf7d0', borderRadius:'12px', padding:'12px 16px', display:'flex', alignItems:'center', gap:'10px', marginBottom:'16px' }}>
              <CheckCircle size={16} color="#16a34a" style={{ flexShrink:0 }} />
              <span style={{ fontSize:'13px', color:'#15803d' }}>{statusMessage.text}</span>
            </div>
          )}

          {!statusMessage.type && (
            <>
              {renderStep()}

              {/* Buttons */}
              <div style={{ display:'flex', gap:'10px', marginTop:'24px' }}>
                {step > 1 && (
                  <button className="auth-btn-secondary" onClick={() => { setErrors({}); setStep(step - 1); }} disabled={loading}>
                    ← Retour
                  </button>
                )}
                <button className="auth-btn-primary" style={{ flex:1 }} onClick={handleNextStep} disabled={btnDisabled}>
                  {loading && step === 3 ? (
                    <>
                      <svg className="animate-spin" style={{ width:'18px', height:'18px' }} viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Inscription…
                    </>
                  ) : step === 3 ? (
                    <><UserPlus size={18} /> Créer mon compte</>
                  ) : step === 2 ? (
                    <>J'accepte et continuer <ArrowRight size={18} /></>
                  ) : (
                    <>Continuer <ArrowRight size={18} /></>
                  )}
                </button>
              </div>
            </>
          )}

          <div style={{ textAlign:'center', marginTop:'20px' }}>
            <p style={{ fontSize:'14px', color:'#6b7280', margin:'0 0 10px' }}>
              Déjà un compte ?{' '}
              <button className="auth-link" onClick={() => router.push('/login')}>Se connecter</button>
            </p>
            <button className="auth-back-link" onClick={() => router.push('/')}>← Retour à l'accueil</button>
          </div>
        </div>
      </div>
    </>
  );
}