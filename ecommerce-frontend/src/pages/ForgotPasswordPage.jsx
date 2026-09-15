'use client';

// ecommerce-frontend/src/pages/ForgotPasswordPage.jsx

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, ArrowLeft, AlertCircle, CheckCircle, Key, X, Send } from 'lucide-react';
import { authAPI } from '../services/api';

function LogoShopCI() {
  return (
    <svg viewBox="0 0 140 34" height="30" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="34" height="34" rx="8" fill="#f97316"/>
      <path d="M7 11h3l3.5 10h8.5l3-8H11" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="14.5" cy="24.5" r="1.5" fill="white"/>
      <circle cx="21" cy="24.5" r="1.5" fill="white"/>
      <text x="42" y="25" fontFamily="'DM Sans',sans-serif" fontSize="20" fontWeight="800" fill="#1a1a1a" letterSpacing="-0.5">Shop</text>
      <text x="91" y="25" fontFamily="'DM Sans',sans-serif" fontSize="20" fontWeight="800" fill="#f97316" letterSpacing="-0.5">CI</text>
    </svg>
  );
}

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep]       = useState(1);
  const [email, setEmail]     = useState('');
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const [shake, setShake]     = useState(false);

  const triggerShake = () => { setShake(true); setTimeout(() => setShake(false), 500); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setError('Veuillez entrer une adresse email valide');
      triggerShake();
      return;
    }
    setLoading(true);
    try {
      await authAPI.forgotPassword({ email });
      setStep(2);
    } catch (err) {
      if (err.response?.data) {
        const msg = err.response.data.error || err.response.data.detail || '';
        setError(msg.includes('not found') ? 'Aucun compte associé à cet email' : msg || 'Une erreur est survenue');
      } else {
        setError('Impossible de se connecter au serveur. Vérifiez votre connexion.');
      }
      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        .fp-root, .fp-root * { font-family: 'DM Sans', sans-serif; box-sizing: border-box; }
        @keyframes fp-fadein { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fp-shake  { 0%,100%{transform:translateX(0)} 20%,60%{transform:translateX(-7px)} 40%,80%{transform:translateX(7px)} }
        @keyframes fp-pop    { 0%{transform:scale(.5);opacity:0} 70%{transform:scale(1.1)} 100%{transform:scale(1);opacity:1} }
        @keyframes fp-spin   { to{transform:rotate(360deg)} }
        .fp-card  { animation: fp-fadein .5s cubic-bezier(.22,1,.36,1) both; }
        .fp-shake { animation: fp-shake .5s ease-in-out; }
        .fp-pop   { animation: fp-pop .55s cubic-bezier(.175,.885,.32,1.275) both; }
        .fp-input {
          width:100%; padding:13px 16px 13px 46px;
          background:#fafafa; border:1.5px solid #e5e7eb; border-radius:12px;
          font-size:15px; color:#1a1a1a; outline:none; font-family:'DM Sans',sans-serif;
          transition:border-color .2s, box-shadow .2s, background .2s;
        }
        .fp-input:focus { border-color:#f97316; background:#fff; box-shadow:0 0 0 4px rgba(249,115,22,.1); }
        .fp-input::placeholder { color:#9ca3af; }
        .fp-input.err { border-color:#ef4444; background:#fff5f5; }
        .fp-btn-primary {
          width:100%; background:#f97316; color:#fff; border:none; border-radius:12px;
          padding:14px; font-size:15px; font-weight:700; cursor:pointer;
          display:flex; align-items:center; justify-content:center; gap:8px;
          box-shadow:0 4px 14px rgba(249,115,22,.32);
          transition:background .2s, transform .15s, box-shadow .2s;
          font-family:'DM Sans',sans-serif;
        }
        .fp-btn-primary:hover:not(:disabled) { background:#ea6a0a; transform:translateY(-1px); box-shadow:0 6px 20px rgba(249,115,22,.4); }
        .fp-btn-primary:disabled { opacity:.55; cursor:not-allowed; transform:none; }
        .fp-btn-ghost {
          width:100%; background:#f9fafb; color:#374151; border:1.5px solid #e5e7eb; border-radius:12px;
          padding:13px; font-size:14px; font-weight:600; cursor:pointer;
          display:flex; align-items:center; justify-content:center; gap:8px;
          transition:background .2s; font-family:'DM Sans',sans-serif;
        }
        .fp-btn-ghost:hover { background:#f3f4f6; }
        .fp-back {
          background:none; border:none; cursor:pointer; color:#9ca3af; font-size:13.5px; font-weight:500;
          display:inline-flex; align-items:center; gap:5px; transition:color .15s; padding:0;
          font-family:'DM Sans',sans-serif;
        }
        .fp-back:hover { color:#374151; }
      `}</style>

      <div className="fp-root" style={{
        minHeight:'100vh', background:'linear-gradient(135deg,#fff7ed 0%,#fafafa 50%,#fff7ed 100%)',
        display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
        padding:'24px 16px', position:'relative', overflow:'hidden',
      }}>
        <div style={{ position:'absolute', top:'-100px', right:'-100px', width:'360px', height:'360px', background:'#f97316', opacity:.05, borderRadius:'50%', pointerEvents:'none' }}/>
        <div style={{ position:'absolute', bottom:'-80px', left:'-80px', width:'280px', height:'280px', background:'#f97316', opacity:.05, borderRadius:'50%', pointerEvents:'none' }}/>

        <div style={{ marginBottom:'28px' }}>
          <button onClick={() => router.push('/')} style={{ background:'none', border:'none', cursor:'pointer', padding:0, display:'flex' }}>
            <LogoShopCI/>
          </button>
        </div>

        {step === 1 && (
          <div className={`fp-card${shake ? ' fp-shake' : ''}`} style={{ background:'#fff', borderRadius:'24px', boxShadow:'0 8px 48px rgba(0,0,0,.08)', width:'100%', maxWidth:'420px', padding:'40px 36px', border:'1px solid #f0f0f0' }}>

            <div style={{ textAlign:'center', marginBottom:'28px' }}>
              <div style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', width:'64px', height:'64px', borderRadius:'18px', marginBottom:'16px', background:'linear-gradient(135deg,#f97316,#fb923c)', boxShadow:'0 6px 20px rgba(249,115,22,.35)' }}>
                <Key size={28} color="#fff"/>
              </div>
              <h1 style={{ fontSize:'24px', fontWeight:800, color:'#1a1a1a', margin:'0 0 8px', letterSpacing:'-.03em' }}>Mot de passe oublié ?</h1>
              <p style={{ fontSize:'14px', color:'#9ca3af', margin:0, lineHeight:1.6 }}>Entrez votre email pour recevoir un lien de réinitialisation</p>
            </div>

            {error && (
              <div style={{ background:'#fff5f5', border:'1.5px solid #fecaca', borderRadius:'12px', padding:'11px 14px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:'8px', marginBottom:'18px' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                  <AlertCircle size={15} color="#ef4444" style={{ flexShrink:0 }}/>
                  <span style={{ fontSize:'13px', color:'#dc2626' }}>{error}</span>
                </div>
                <button onClick={() => setError('')} style={{ background:'none', border:'none', cursor:'pointer', color:'#ef4444', display:'flex', padding:0 }}><X size={13}/></button>
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:'18px' }}>
              <div>
                <label style={{ display:'block', fontSize:'12.5px', fontWeight:700, color:'#374151', marginBottom:'7px', letterSpacing:'.02em' }}>Adresse email</label>
                <div style={{ position:'relative' }}>
                  <Mail size={17} color={error ? '#ef4444' : '#9ca3af'} style={{ position:'absolute', left:'14px', top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }}/>
                  <input type="email" value={email} required className={`fp-input${error ? ' err' : ''}`} placeholder="votre.email@exemple.com"
                    onChange={e => { setEmail(e.target.value); setError(''); }}/>
                </div>
              </div>
              <button type="submit" className="fp-btn-primary" disabled={loading}>
                {loading
                  ? <><svg style={{ width:17, height:17, animation:'fp-spin .8s linear infinite', flexShrink:0 }} viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" strokeDasharray="40" strokeDashoffset="10" strokeLinecap="round"/></svg>Envoi en cours…</>
                  : <><Send size={17}/>Envoyer le lien</>}
              </button>
            </form>

            <div style={{ textAlign:'center', marginTop:'22px' }}>
              <button className="fp-back" onClick={() => router.push('/login')}><ArrowLeft size={14}/> Retour à la connexion</button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="fp-card" style={{ background:'#fff', borderRadius:'24px', boxShadow:'0 8px 48px rgba(0,0,0,.08)', width:'100%', maxWidth:'420px', padding:'40px 36px', border:'1px solid #f0f0f0', textAlign:'center' }}>

            <div className="fp-pop" style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', width:'72px', height:'72px', borderRadius:'50%', marginBottom:'20px', background:'linear-gradient(135deg,#f97316,#fb923c)', boxShadow:'0 6px 20px rgba(249,115,22,.35)' }}>
              <CheckCircle size={34} color="#fff"/>
            </div>

            <h2 style={{ fontSize:'24px', fontWeight:800, color:'#1a1a1a', margin:'0 0 8px', letterSpacing:'-.03em' }}>Email envoyé !</h2>
            <p style={{ fontSize:'14px', color:'#9ca3af', margin:'0 0 4px' }}>Un lien de réinitialisation a été envoyé à :</p>
            <p style={{ fontSize:'15px', fontWeight:700, color:'#f97316', margin:'0 0 24px', wordBreak:'break-all' }}>{email}</p>

            <div style={{ background:'#fff7ed', border:'1.5px solid #fed7aa', borderRadius:'14px', padding:'16px 20px', marginBottom:'24px', textAlign:'left' }}>
              <p style={{ fontSize:'13px', fontWeight:700, color:'#1a1a1a', margin:'0 0 10px' }}>Instructions :</p>
              <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                {['Vérifiez votre boîte de réception','Cliquez sur le lien dans l\'email','Créez un nouveau mot de passe sécurisé','Le lien expire dans 24 heures'].map((s, i) => (
                  <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:'10px' }}>
                    <span style={{ width:'6px', height:'6px', borderRadius:'50%', background:'#f97316', flexShrink:0, marginTop:'6px', display:'block' }}/>
                    <span style={{ fontSize:'13px', color:'#6b7280', lineHeight:1.5 }}>{s}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
              <button className="fp-btn-primary" onClick={() => router.push('/login')}>Retour à la connexion</button>
              <button className="fp-btn-ghost" onClick={() => setStep(1)}>Renvoyer l'email</button>
            </div>
            <p style={{ fontSize:'12.5px', color:'#9ca3af', marginTop:'16px' }}>Vous n'avez pas reçu l'email ? <strong style={{ color:'#6b7280' }}>Vérifiez vos spams</strong></p>
          </div>
        )}
      </div>
    </>
  );
}