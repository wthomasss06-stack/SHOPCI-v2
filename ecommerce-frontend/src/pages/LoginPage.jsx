'use client';

// ecommerce-frontend/src/pages/LoginPage.jsx
// Login + Register unifiés — Big Switch ShopCI

import React, { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  LogIn, User, Mail, Lock, Phone, MapPin, ShoppingBag, Store,
  AlertCircle, CheckCircle, Eye, EyeOff, ArrowRight, X, UserPlus,
  ShieldCheck, Zap, Gift, Home
} from 'lucide-react';
import { authAPI } from '../services/api';

/* ── Logo SVG ─────────────────────────────────────────── */
function LogoShopCI({ size = 32, white = false, dark = false }) {
  return (
    <svg viewBox="0 0 140 34" height={size} fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="34" height="34" rx="8" fill={white ? 'rgba(255,255,255,.25)' : '#f97316'}/>
      <path d="M7 11h3l3.5 10h8.5l3-8H11" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="14.5" cy="24.5" r="1.5" fill="white"/>
      <circle cx="21" cy="24.5" r="1.5" fill="white"/>
      <text x="42" y="25" fontFamily="'DM Sans',sans-serif" fontSize="20" fontWeight="800" fill={white ? '#fff' : dark ? '#f5f5f7' : '#1a1a1a'} letterSpacing="-0.5">Shop</text>
      <text x="91" y="25" fontFamily="'DM Sans',sans-serif" fontSize="20" fontWeight="800" fill={white ? 'rgba(255,255,255,.85)' : '#f97316'} letterSpacing="-0.5">CI</text>
    </svg>
  );
}

const Spinner = () => (
  <svg style={{ width:18, height:18, animation:'auth-spin .8s linear infinite', flexShrink:0 }} viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" strokeDasharray="40" strokeDashoffset="10" strokeLinecap="round"/>
  </svg>
);

/* ── Helpers — reçoivent tous dark en prop ── */
const CGUContent = ({ dark }) => (
  <div style={{ height:'200px', overflowY:'auto', background: dark ? '#2c2c2e' : '#f9fafb', border:`1.5px solid ${dark ? '#48484a' : '#e5e7eb'}`, borderRadius:'10px', padding:'14px 16px', fontSize:'12px', color: dark ? '#aeaeb2' : '#6b7280', lineHeight:1.6 }}>
    {[
      { t:'1. Présentation', b:"ShopCI est une plateforme de mise en relation entre vendeurs et acheteurs pour l'achat de divers produits en Côte d'Ivoire." },
      { t:'2. Rôle de ShopCI', b:"ShopCI n'est ni vendeur ni propriétaire des produits. Nous mettons à disposition un espace permettant aux vendeurs de publier et aux acheteurs d'acquérir des produits." },
      { t:'3. Responsabilité', b:'ShopCI ne peut être tenu responsable des fraudes, de la qualité des produits, ou de litiges entre vendeur et acheteur.' },
      { t:'4. Vos engagements', b:"En utilisant ShopCI, vous vous engagez à fournir des informations exactes, ne pas publier de produits illégaux, et agir avec honnêteté." },
      { t:'5. Données personnelles', b:'Vos données sont traitées confidentiellement et ne sont jamais revendues à des tiers.' },
    ].map(({ t, b }) => (
      <div key={t} style={{ marginBottom:'10px' }}>
        <p style={{ fontWeight:700, color: dark ? '#f5f5f7' : '#374151', margin:'0 0 3px', fontSize:'12px' }}>{t}</p>
        <p style={{ margin:0 }}>{b}</p>
      </div>
    ))}
  </div>
);

const inputStyle = (err, dark) => ({
  width:'100%', padding:'14px 16px 14px 44px',
  background: dark ? '#2c2c2e' : '#fafafa',
  border:`2px solid ${err ? '#ef4444' : dark ? '#48484a' : '#e5e7eb'}`,
  borderRadius:'12px', fontSize:'15px',
  color: dark ? '#f5f5f7' : '#1a1a1a',
  outline:'none', fontFamily:'inherit',
  boxSizing:'border-box', transition:'border-color .2s, box-shadow .2s',
  lineHeight:'1.4',
});

const Field = ({ label, name, type='text', value, onChange, onToggle, show, placeholder, error, icon:Icon, required=false, smallPad=false, dark=false }) => (
  <div style={{ marginBottom:'16px' }}>
    {label && <label style={{ display:'block', fontSize:'12.5px', fontWeight:700, color: dark ? '#aeaeb2' : '#374151', marginBottom:'6px', letterSpacing:'.02em' }}>{label}{required&&<span style={{color:'#f97316'}}> *</span>}</label>}
    <div style={{ position:'relative' }}>
      <Icon size={17} color={error?'#ef4444':'#9ca3af'} style={{ position:'absolute', left:'13px', top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }}/>
      <input type={onToggle?(show?'text':'password'):type} name={name} value={value} onChange={onChange} placeholder={placeholder} required={required}
        style={{ ...inputStyle(error, dark), ...(onToggle?{paddingRight:'44px'}:{}), ...(smallPad?{padding:'12px 14px 12px 40px'}:{}) }}
        onFocus={e=>{e.target.style.borderColor='#f97316';e.target.style.boxShadow='0 0 0 3px rgba(249,115,22,.12)';}}
        onBlur={e=>{e.target.style.borderColor=error?'#ef4444':dark?'#48484a':'#e5e7eb';e.target.style.boxShadow='none';}}/>
      {onToggle&&<button type="button" onClick={onToggle} style={{ position:'absolute', right:'12px', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#9ca3af', display:'flex', padding:0 }}>{show?<EyeOff size={17}/>:<Eye size={17}/>}</button>}
    </div>
    {error&&<p style={{ color:'#ef4444', fontSize:'12px', margin:'4px 0 0' }}>{error}</p>}
  </div>
);

const Alert = ({ msg, onClose }) => {
  if (!msg.text) return null;
  const ok = msg.type==='success';
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:'8px', background:ok?'#f0fdf4':'#fff5f5', border:`1.5px solid ${ok?'#bbf7d0':'#fecaca'}`, borderRadius:'10px', padding:'10px 14px', marginBottom:'14px', animation:ok?'none':'auth-shk .4s' }}>
      <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
        {ok?<CheckCircle size={14} color="#16a34a"/>:<AlertCircle size={14} color="#ef4444"/>}
        <span style={{ fontSize:'13px', color:ok?'#15803d':'#dc2626' }}>{msg.text}</span>
      </div>
      {onClose&&!ok&&<button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'#ef4444', display:'flex', padding:0 }}><X size={13}/></button>}
    </div>
  );
};

/* ════════════════════════════════════════════════════════ */
export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode]           = useState('login');
  const [switching, setSwitching] = useState(false);

  /* ── Dark mode : 1 seule source de vérité, propagée à tous les enfants ── */
  const [dark, setDark] = useState(() => {
    try { return localStorage.getItem('shopci-theme') === 'dark'; } catch { return false; }
  });
  useEffect(() => {
    // Sync immédiat avec l'état réel du DOM au montage
    setDark(document.body.classList.contains('dark'));
    // Écouter les changements futurs (toggle Navbar)
    const obs = new MutationObserver(() =>
      setDark(document.body.classList.contains('dark'))
    );
    obs.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);

  /* Login */
  const [loginData, setLoginData]   = useState({ username:'', password:'' });
  const [loginMsg,  setLoginMsg]    = useState({ type:null, text:'' });
  const [loginLoading, setLoginLoading] = useState(false);
  const [showLPwd, setShowLPwd]     = useState(false);

  /* Register */
  const [regStep, setRegStep]       = useState(1);
  const [regData, setRegData]       = useState({ username:'', email:'', password:'', password2:'', phone:'', address:'', user_type:'acheteur' });
  const [regErrors, setRegErrors]   = useState({});
  const [regMsg,   setRegMsg]       = useState({ type:null, text:'' });
  const [regLoading, setRegLoading] = useState(false);
  const [showRP,  setShowRP]        = useState(false);
  const [showRP2, setShowRP2]       = useState(false);
  const [terms,   setTerms]         = useState(false);
  const [pwdStr,  setPwdStr]        = useState({ score:0, label:'', color:'' });

  /* Switch */
  const switchTo = useCallback((target) => {
    if (target === mode || switching) return;
    setSwitching(true);
    setTimeout(() => { setMode(target); setSwitching(false); }, 440);
  }, [mode, switching]);

  const evalStr = (v) => {
    if (!v) { setPwdStr({ score:0, label:'', color:'' }); return; }
    let s=0;
    if(v.length>=8)s++; if(/[A-Z]/.test(v))s++; if(/[a-z]/.test(v))s++;
    if(/[0-9]/.test(v))s++; if(/[!@#$%^&*(),.?":{}|<>]/.test(v))s++; if(!/^\d+$/.test(v))s++;
    setPwdStr(s<=2?{score:s,label:'Faible',color:'#ef4444'}:s<=4?{score:s,label:'Moyen',color:'#f59e0b'}:{score:s,label:'Fort',color:'#22c55e'});
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginMsg({ type:null, text:'' });
    setLoginLoading(true);
    try {
      await authAPI.login(loginData);
      setLoginMsg({ type:'success', text:'Connexion réussie ! Redirection…' });
      const user = authAPI.getCurrentUser();
      const dest = user?.user_type === 'vendeur' ? '/vendor/dashboard' : '/buyer/dashboard';
      setTimeout(() => router.push(dest), 1500);
    } catch (err) {
      const MAP = { 'Invalid credentials':'Identifiants incorrects', 'User account is disabled':'Compte désactivé', 'No active account found':'Aucun compte actif', 'Unable to log in with provided credentials':'Identifiants incorrects' };
      let msg = 'Erreur de connexion. Veuillez réessayer.';
      if (err.response?.data) {
        let raw = err.response.data.error || err.response.data.detail || err.response.data.message || '';
        Object.keys(MAP).forEach(k => { if (raw.includes(k)) raw = MAP[k]; });
        if (raw) msg = raw;
      } else if (err.request) msg = 'Serveur inaccessible.';
      setLoginMsg({ type:'error', text:msg });
    } finally { setLoginLoading(false); }
  };

  const validateReg = () => {
    const e={};
    if(!regData.username||regData.username.length<3) e.username='Min. 3 caractères';
    if(!regData.email||!/\S+@\S+\.\S+/.test(regData.email)) e.email='Email invalide';
    if(!regData.password||regData.password.length<8) e.password='Min. 8 caractères';
    else if(/^\d+$/.test(regData.password)) e.password='Pas entièrement numérique';
    else if(pwdStr.score<3) e.password='Mot de passe trop faible';
    if(regData.password!==regData.password2) e.password2='Les mots de passe ne correspondent pas';
    if(!regData.phone||regData.phone.length<10) e.phone='Numéro invalide';
    setRegErrors(e);
    return Object.keys(e).length===0;
  };

  const handleRegister = async () => {
    if (!validateReg()) return;
    setRegLoading(true);
    try {
      await authAPI.register(regData);
      setRegMsg({ type:'success', text:'Compte créé avec succès !' });
      setTimeout(() => switchTo('login'), 3000);
    } catch (err) {
      const AMAP = { 'A user with that username already exists.':'Ce nom existe déjà.', 'user with this email already exists.':'Cet email est déjà utilisé.', 'password_too_common':'Mot de passe trop courant.' };
      if (err.response?.data) {
        const api = err.response.data; const ne={};
        Object.keys(api).forEach(k => { if(Array.isArray(api[k])){ api[k].forEach(er=>{ const s=typeof er==='object'?er.message||er.string:er; let t=s; Object.keys(AMAP).forEach(m=>{if(s.includes(m))t=AMAP[m];}); ne[k]=t; }); } });
        setRegErrors(ne);
        setRegMsg({ type:'error', text:'Veuillez corriger les erreurs.' });
      } else { setRegMsg({ type:'error', text:"Erreur lors de l'inscription." }); }
    } finally { setRegLoading(false); }
  };

  const handleRegNext = () => {
    if(regStep===1) setRegStep(2);
    else if(regStep===2&&terms) setRegStep(3);
    else if(regStep===3) handleRegister();
  };

  const regBtnDisabled = (regStep===1&&!regData.user_type)||(regStep===2&&!terms)||regLoading;

  const renderRegStep = () => {
    if (regStep===1) return (
      <div>
        <p style={{ fontSize:'12px', fontWeight:700, color: dark?'#aeaeb2':'#374151', marginBottom:'10px' }}>Je veux m'inscrire en tant que :</p>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', marginBottom:'4px' }}>
          {[{v:'acheteur',icon:<ShoppingBag size={24}/>,label:'Acheteur',sub:"J'achète"},{v:'vendeur',icon:<Store size={24}/>,label:'Vendeur',sub:'Je vends'}].map(({v,icon,label,sub}) => {
            const sel=regData.user_type===v;
            return <div key={v} onClick={()=>setRegData({...regData,user_type:v})} style={{ padding:'16px 10px', borderRadius:'12px', textAlign:'center', cursor:'pointer', border:`2px solid ${sel?'#f97316':dark?'#48484a':'#e5e7eb'}`, background:sel?'#fff7ed':dark?'#2c2c2e':'#fafafa', boxShadow:sel?'0 0 0 3px rgba(249,115,22,.1)':'none', transition:'all .2s' }}>
              <div style={{ color:sel?'#f97316':'#9ca3af', display:'flex', justifyContent:'center', marginBottom:'6px' }}>{icon}</div>
              <div style={{ fontWeight:700, fontSize:'13px', color:dark?'#f5f5f7':'#1a1a1a' }}>{label}</div>
              <div style={{ fontSize:'11px', color:'#9ca3af' }}>{sub}</div>
            </div>;
          })}
        </div>
      </div>
    );
    if (regStep===2) return (
      <div>
        <CGUContent dark={dark}/>
        <label style={{ display:'flex', alignItems:'flex-start', gap:'8px', cursor:'pointer', marginTop:'12px' }}>
          <input type="checkbox" checked={terms} onChange={e=>setTerms(e.target.checked)} style={{ width:'15px', height:'15px', accentColor:'#f97316', marginTop:'2px', flexShrink:0 }}/>
          <span style={{ fontSize:'12px', color:dark?'#aeaeb2':'#6b7280', lineHeight:1.5 }}>J'accepte les <span style={{ color:'#f97316', fontWeight:700 }}>conditions d'utilisation</span> de ShopCI</span>
        </label>
      </div>
    );
    if (regStep===3) return (
      <div>
        <Field label="Nom d'utilisateur" name="username" value={regData.username} required icon={User} placeholder="votre_pseudo" error={regErrors.username} dark={dark}
          onChange={e=>{setRegData({...regData,username:e.target.value});if(regErrors.username)setRegErrors({...regErrors,username:''});}}/>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' }}>
          <Field label="Email" name="email" type="email" value={regData.email} required icon={Mail} placeholder="email@ex.com" error={regErrors.email} dark={dark}
            onChange={e=>{setRegData({...regData,email:e.target.value});if(regErrors.email)setRegErrors({...regErrors,email:''});}}/>
          <Field label="Téléphone" name="phone" type="tel" value={regData.phone} required icon={Phone} placeholder="+225 07..." error={regErrors.phone} dark={dark}
            onChange={e=>{setRegData({...regData,phone:e.target.value});if(regErrors.phone)setRegErrors({...regErrors,phone:''});}}/>
        </div>
        <Field label="Adresse" name="address" value={regData.address} icon={MapPin} placeholder="Cocody, Abidjan" dark={dark}
          onChange={e=>setRegData({...regData,address:e.target.value})}/>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' }}>
          <div style={{ marginBottom:'4px' }}>
            <label style={{ display:'block', fontSize:'12.5px', fontWeight:700, color:dark?'#aeaeb2':'#374151', marginBottom:'6px' }}>Mot de passe <span style={{color:'#f97316'}}>*</span></label>
            <div style={{ position:'relative' }}>
              <Lock size={17} color={regErrors.password?'#ef4444':'#9ca3af'} style={{ position:'absolute', left:'13px', top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }}/>
              <input type={showRP?'text':'password'} value={regData.password} placeholder="••••••••"
                onChange={e=>{const v=e.target.value;setRegData({...regData,password:v});evalStr(v);if(regErrors.password)setRegErrors({...regErrors,password:''});}}
                style={{ ...inputStyle(regErrors.password, dark), paddingLeft:'40px', paddingRight:'40px', fontSize:'15px' }}
                onFocus={e=>{e.target.style.borderColor='#f97316';e.target.style.boxShadow='0 0 0 3px rgba(249,115,22,.12)';}}
                onBlur={e=>{e.target.style.borderColor=regErrors.password?'#ef4444':dark?'#48484a':'#e5e7eb';e.target.style.boxShadow='none';}}/>
              <button type="button" onClick={()=>setShowRP(!showRP)} style={{ position:'absolute', right:'11px', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#9ca3af', display:'flex', padding:0 }}>{showRP?<EyeOff size={17}/>:<Eye size={17}/>}</button>
            </div>
            {pwdStr.label&&<div style={{ marginTop:'5px' }}><div style={{ height:'3px', background:dark?'#48484a':'#e5e7eb', borderRadius:'3px', overflow:'hidden' }}><div style={{ height:'100%', width:`${Math.round(pwdStr.score/6*100)}%`, background:pwdStr.color, borderRadius:'3px', transition:'width .3s' }}/></div><span style={{ fontSize:'10px', color:pwdStr.color, fontWeight:700 }}>{pwdStr.label}</span></div>}
            {regErrors.password&&<p style={{ color:'#ef4444', fontSize:'11px', margin:'3px 0 0' }}>{regErrors.password}</p>}
          </div>
          <div style={{ marginBottom:'4px' }}>
            <label style={{ display:'block', fontSize:'12.5px', fontWeight:700, color:dark?'#aeaeb2':'#374151', marginBottom:'6px' }}>Confirmer <span style={{color:'#f97316'}}>*</span></label>
            <div style={{ position:'relative' }}>
              <Lock size={17} color={regErrors.password2?'#ef4444':'#9ca3af'} style={{ position:'absolute', left:'13px', top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }}/>
              <input type={showRP2?'text':'password'} value={regData.password2} placeholder="••••••••"
                onChange={e=>{setRegData({...regData,password2:e.target.value});if(regErrors.password2)setRegErrors({...regErrors,password2:''});}}
                style={{ ...inputStyle(regErrors.password2, dark), paddingLeft:'40px', paddingRight:'40px', fontSize:'15px' }}
                onFocus={e=>{e.target.style.borderColor='#f97316';e.target.style.boxShadow='0 0 0 3px rgba(249,115,22,.12)';}}
                onBlur={e=>{e.target.style.borderColor=regErrors.password2?'#ef4444':dark?'#48484a':'#e5e7eb';e.target.style.boxShadow='none';}}/>
              <button type="button" onClick={()=>setShowRP2(!showRP2)} style={{ position:'absolute', right:'11px', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#9ca3af', display:'flex', padding:0 }}>{showRP2?<EyeOff size={17}/>:<Eye size={17}/>}</button>
            </div>
            {regData.password2&&regData.password===regData.password2&&<span style={{ fontSize:'10px', color:'#22c55e', fontWeight:700 }}>✓ Correspondent</span>}
            {regErrors.password2&&<p style={{ color:'#ef4444', fontSize:'11px', margin:'3px 0 0' }}>{regErrors.password2}</p>}
          </div>
        </div>
      </div>
    );
  };

  const overlayOnRight = mode === 'login';

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        *{box-sizing:border-box;}
        body{margin:0;}
        .auth-root{font-family:'DM Sans',sans-serif;}
        .auth-root *{font-family:'DM Sans',sans-serif;}
        @keyframes auth-spin{to{transform:rotate(360deg)}}
        @keyframes auth-shk{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-6px)}40%,80%{transform:translateX(6px)}}
        @keyframes auth-fadein{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}

        .auth-card{
          position:relative;
          width:100%;max-width:940px;height:680px;
          background:${dark ? '#1c1c1e' : '#fff'};border-radius:24px;
          box-shadow:${dark ? '0 24px 80px rgba(0,0,0,.5),0 4px 16px rgba(0,0,0,.3)' : '0 24px 80px rgba(0,0,0,.11),0 4px 16px rgba(0,0,0,.06)'};
          overflow:hidden;display:flex;
          animation:auth-fadein .6s ease both;
          border:1px solid ${dark ? '#3a3a3c' : '#f0f0f0'};
        }
        .form-panel{
          position:absolute;top:0;bottom:0;width:52%;
          padding:38px 34px;
          display:flex;flex-direction:column;
          overflow-y:auto;overflow-x:hidden;
          transition:opacity .38s ease;
        }
        .form-panel::-webkit-scrollbar{width:4px;}
        .form-panel::-webkit-scrollbar-thumb{background:rgba(249,115,22,.4);border-radius:4px;}
        .panel-login{left:0;}
        .panel-register{right:0;}
        .overlay-panel{
          position:absolute;top:0;bottom:0;width:48%;
          background:linear-gradient(148deg,#f97316 0%,#ea6a0a 55%,#c45500 100%);
          display:flex;flex-direction:column;align-items:center;justify-content:center;
          gap:18px;padding:50px 36px;text-align:center;z-index:20;overflow:hidden;
        }
        .overlay-panel::before{content:'';position:absolute;inset:0;background:repeating-linear-gradient(45deg,rgba(255,255,255,0) 0,rgba(255,255,255,0) 18px,rgba(255,255,255,.04) 18px,rgba(255,255,255,.04) 19px);pointer-events:none;}
        .overlay-panel::after{content:'';position:absolute;width:260px;height:260px;border-radius:50%;background:rgba(255,255,255,.07);bottom:-80px;right:-80px;pointer-events:none;}
        .overlay-right{left:auto;right:0;border-radius:0 24px 24px 0;transition:left .52s cubic-bezier(.68,-.1,.27,1.1),right .52s cubic-bezier(.68,-.1,.27,1.1),border-radius .52s;box-shadow:-14px 0 36px rgba(249,115,22,.18);}
        .overlay-left{left:0;right:auto;border-radius:24px 0 0 24px;transition:left .52s cubic-bezier(.68,-.1,.27,1.1),right .52s cubic-bezier(.68,-.1,.27,1.1),border-radius .52s;box-shadow:14px 0 36px rgba(249,115,22,.18);}
        .ov-circle{width:68px;height:68px;border-radius:50%;background:rgba(255,255,255,.18);border:2px solid rgba(255,255,255,.32);display:flex;align-items:center;justify-content:center;backdrop-filter:blur(6px);}
        .ov-title{font-size:26px;font-weight:800;color:#fff;line-height:1.1;letter-spacing:-.03em;margin:0;}
        .ov-sub{font-size:13px;color:rgba(255,255,255,.82);max-width:210px;line-height:1.65;margin:0;}
        .ov-feats{display:flex;flex-direction:column;gap:8px;align-self:stretch;text-align:left;}
        .ov-feat{display:flex;align-items:center;gap:9px;padding:9px 12px;background:rgba(255,255,255,.13);border:1px solid rgba(255,255,255,.18);border-radius:10px;font-size:12.5px;color:rgba(255,255,255,.9);}
        .btn-ov-switch{padding:12px 34px;background:transparent;border:2px solid rgba(255,255,255,.68);border-radius:999px;color:#fff;font-size:14px;font-weight:700;letter-spacing:.04em;cursor:pointer;transition:all .25s cubic-bezier(.34,1.56,.64,1);font-family:'DM Sans',sans-serif;position:relative;z-index:2;margin-top:4px;}
        .btn-ov-switch:hover{background:#fff;color:#f97316;border-color:#fff;transform:scale(1.05);}
        .btn-ov-switch:disabled{opacity:.6;cursor:not-allowed;transform:none;}
        .auth-btn-main{width:100%;background:#f97316;color:#fff;border:none;border-radius:10px;padding:13px;font-size:14px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;box-shadow:0 4px 14px rgba(249,115,22,.28);transition:background .2s,transform .15s,box-shadow .2s;font-family:'DM Sans',sans-serif;}
        .auth-btn-main:hover:not(:disabled){background:#ea6a0a;transform:translateY(-1px);box-shadow:0 6px 20px rgba(249,115,22,.36);}
        .auth-btn-main:disabled{opacity:.5;cursor:not-allowed;transform:none;}
        .auth-btn-ghost{background:transparent;color:${dark?'#aeaeb2':'#6b7280'};border:1.5px solid ${dark?'#48484a':'#e5e7eb'};border-radius:10px;padding:11px 16px;font-size:13px;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;transition:background .2s;font-family:'DM Sans',sans-serif;}
        .auth-btn-ghost:hover{background:${dark?'#2c2c2e':'#f9fafb'};}
        .mob-tabs{display:none;background:${dark?'#2c2c2e':'#f9fafb'};border-radius:12px;padding:4px;margin-bottom:18px;}
        .mob-tabs-inner{display:grid;grid-template-columns:1fr 1fr;gap:4px;}
        .mob-tab{padding:10px;border:none;border-radius:9px;font-size:13px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;transition:all .2s;background:none;color:${dark?'#636366':'#9ca3af'};font-family:'DM Sans',sans-serif;}
        .mob-tab.active{background:#f97316;color:#fff;box-shadow:0 4px 12px rgba(249,115,22,.32);}
        @media(max-width:820px){
          .auth-card{height:auto;min-height:auto;max-width:480px;flex-direction:column;}
          .overlay-panel{display:none!important;}
          .form-panel{position:relative!important;width:100%!important;left:auto!important;right:auto!important;padding:26px 20px;}
          .mob-tabs{display:block;}
          .panel-login.mob-off,.panel-register.mob-off{display:none;}
        }
        @media(max-width:480px){.form-panel{padding:20px 14px;}}
      `}</style>

      <div className="auth-root" style={{ minHeight:'100vh', background: dark ? 'linear-gradient(135deg,#0d0d0f 0%,#111113 48%,#0d0d0f 100%)' : 'linear-gradient(135deg,#fff7ed 0%,#fafafa 48%,#fff7ed 100%)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'20px 16px', position:'relative', overflow:'hidden' }}>

        <div style={{ position:'absolute', top:'-100px', right:'-100px', width:'380px', height:'380px', background:'#f97316', opacity:.05, borderRadius:'50%', pointerEvents:'none' }}/>
        <div style={{ position:'absolute', bottom:'-80px', left:'-80px', width:'280px', height:'280px', background:'#f97316', opacity:.05, borderRadius:'50%', pointerEvents:'none' }}/>

        <div style={{ marginBottom:'22px' }}>
          <button onClick={()=>router.push('/')} style={{ background:'none', border:'none', cursor:'pointer', padding:0, display:'flex' }}>
            <LogoShopCI size={34} dark={dark}/>
          </button>
        </div>

        <div className="auth-card">

          <div className={`overlay-panel ${overlayOnRight ? 'overlay-right' : 'overlay-left'}`}>
            <div className="ov-circle">
              <svg viewBox="0 0 44 44" width="34" height="34" fill="none">
                <rect width="44" height="44" rx="10" fill="rgba(255,255,255,.22)"/>
                <path d="M10 16h4l4.5 13h11l3.5-10H14" stroke="white" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="19.5" cy="32" r="2" fill="white"/>
                <circle cx="27.5" cy="32" r="2" fill="white"/>
              </svg>
            </div>
            {mode === 'login' ? (<>
              <h2 className="ov-title">Nouveau ici ?</h2>
              <p className="ov-sub">Créez un compte et découvrez des milliers de produits sur ShopCI.</p>
              <div className="ov-feats">
                {[{icon:<ShoppingBag size={14}/>,text:'Achetez en toute sécurité'},{icon:<Store size={14}/>,text:'Vendez vos produits'},{icon:<MapPin size={14}/>,text:'Livraison partout en CI'}].map(({icon,text})=>(
                  <div key={text} className="ov-feat">{icon}{text}</div>
                ))}
              </div>
              <button className="btn-ov-switch" onClick={()=>switchTo('register')} disabled={switching}>S'inscrire →</button>
            </>) : (<>
              <h2 className="ov-title">Déjà un compte ?</h2>
              <p className="ov-sub">Connectez-vous pour accéder à vos commandes et vos favoris.</p>
              <div className="ov-feats">
                {[{icon:<ShieldCheck size={14}/>,text:'Connexion sécurisée'},{icon:<Zap size={14}/>,text:'Accès instantané'},{icon:<Gift size={14}/>,text:'Offres personnalisées'}].map(({icon,text})=>(
                  <div key={text} className="ov-feat">{icon}{text}</div>
                ))}
              </div>
              <button className="btn-ov-switch" onClick={()=>switchTo('login')} disabled={switching}>← Se connecter</button>
            </>)}
          </div>

          {/* ── LOGIN PANEL ── */}
          <div className={`form-panel panel-login ${mode==='register'?'mob-off':''}`}
            style={{ opacity:mode==='login'?1:0, pointerEvents:mode==='login'?'auto':'none' }}>
            <div className="mob-tabs">
              <div className="mob-tabs-inner">
                <button className={`mob-tab${mode==='login'?' active':''}`} onClick={()=>switchTo('login')}><LogIn size={14}/> Connexion</button>
                <button className={`mob-tab${mode==='register'?' active':''}`} onClick={()=>switchTo('register')}><UserPlus size={14}/> Inscription</button>
              </div>
            </div>
            <div style={{ marginBottom:'24px' }}>
              <h1 style={{ fontSize:'24px', fontWeight:800, color:dark?'#f5f5f7':'#1a1a1a', margin:'0 0 4px', letterSpacing:'-.03em' }}>Bon retour <span style={{ display:'inline-flex', verticalAlign:'middle', marginBottom:'2px' }}><Home size={22} color="#f97316"/></span></h1>
              <p style={{ fontSize:'13.5px', color:'#9ca3af', margin:0 }}>Connectez-vous à votre compte ShopCI</p>
            </div>
            <Alert msg={loginMsg} onClose={()=>setLoginMsg({type:null,text:''})}/>
            <form onSubmit={handleLogin} style={{ flex:1, display:'flex', flexDirection:'column' }}>
              <Field label="Nom d'utilisateur" name="username" value={loginData.username} required icon={User} placeholder="votre_username" dark={dark}
                onChange={e=>{setLoginData({...loginData,username:e.target.value});setLoginMsg({type:null,text:''});}}/>
              <Field label="Mot de passe" name="password" value={loginData.password} required icon={Lock} placeholder="••••••••" dark={dark}
                onToggle={()=>setShowLPwd(!showLPwd)} show={showLPwd}
                onChange={e=>{setLoginData({...loginData,password:e.target.value});setLoginMsg({type:null,text:''});}}/>
              <div style={{ textAlign:'right', marginBottom:'18px', marginTop:'-4px' }}>
                <button type="button" onClick={()=>router.push('/forgot-password')} style={{ background:'none', border:'none', cursor:'pointer', color:'#f97316', fontSize:'12.5px', fontWeight:600, padding:0, fontFamily:'inherit' }}>
                  Mot de passe oublié ?
                </button>
              </div>
              <button type="submit" className="auth-btn-main" disabled={loginLoading||loginMsg.type==='success'}>
                {loginLoading||loginMsg.type==='success' ? <><Spinner/>{loginMsg.type==='success'?'Redirection…':'Connexion…'}</> : <><LogIn size={17}/>Se connecter</>}
              </button>
            </form>
            <div style={{ marginTop:'20px', paddingTop:'18px', borderTop:`1px solid ${dark?'#3a3a3c':'#f3f4f6'}`, textAlign:'center' }}>
              <p style={{ fontSize:'13px', color:'#9ca3af', margin:0 }}>
                Pas encore de compte ?{' '}
                <button onClick={()=>switchTo('register')} style={{ background:'none', border:'none', cursor:'pointer', color:'#f97316', fontWeight:700, fontSize:'13px', padding:0, fontFamily:'inherit' }}>S'inscrire</button>
              </p>
            </div>
          </div>

          {/* ── REGISTER PANEL ── */}
          <div className={`form-panel panel-register ${mode==='login'?'mob-off':''}`}
            style={{ opacity:mode==='register'?1:0, pointerEvents:mode==='register'?'auto':'none', transition:'opacity .38s ease .22s' }}>
            <div className="mob-tabs">
              <div className="mob-tabs-inner">
                <button className={`mob-tab${mode==='login'?' active':''}`} onClick={()=>switchTo('login')}><LogIn size={14}/> Connexion</button>
                <button className={`mob-tab${mode==='register'?' active':''}`} onClick={()=>switchTo('register')}><UserPlus size={14}/> Inscription</button>
              </div>
            </div>
            <div style={{ marginBottom:'14px' }}>
              <h1 style={{ fontSize:'22px', fontWeight:800, color:dark?'#f5f5f7':'#1a1a1a', margin:'0 0 3px', letterSpacing:'-.03em' }}>Créer un compte <span style={{ display:'inline-flex', verticalAlign:'middle', marginBottom:'2px' }}><Zap size={20} color="#f97316"/></span></h1>
              <p style={{ fontSize:'13px', color:'#9ca3af', margin:0 }}>Rejoignez la communauté ShopCI</p>
            </div>
            <div style={{ display:'flex', alignItems:'center', marginBottom:'14px' }}>
              {['Type','CGU','Infos'].map((lbl,i)=>{
                const n=i+1, done=n<regStep, active=n===regStep;
                return <React.Fragment key={n}>
                  <div style={{ width:'26px', height:'26px', borderRadius:'50%', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'11px', fontWeight:700, background:done||active?'#f97316':dark?'#3a3a3c':'#e5e7eb', color:done||active?'#fff':dark?'#636366':'#9ca3af', boxShadow:active?'0 0 0 3px rgba(249,115,22,.2)':'none', transition:'all .25s' }}>{done?'✓':n}</div>
                  <span style={{ fontSize:'11px', color:active?'#f97316':dark?'#636366':'#9ca3af', margin:'0 4px', fontWeight:active?700:400 }}>{lbl}</span>
                  {i<2&&<div style={{ flex:1, height:'2px', background:done?'#f97316':dark?'#3a3a3c':'#e5e7eb', marginRight:'4px', transition:'background .3s' }}/>}
                </React.Fragment>;
              })}
            </div>
            <Alert msg={regMsg} onClose={()=>setRegMsg({type:null,text:''})}/>
            {regMsg.type==='success' ? (
              <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'12px', textAlign:'center' }}>
                <div style={{ width:'60px', height:'60px', borderRadius:'50%', background:'#f0fdf4', border:'2px solid #bbf7d0', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <CheckCircle size={30} color="#22c55e"/>
                </div>
                <p style={{ fontSize:'15px', color:dark?'#f5f5f7':'#374151', fontWeight:700, margin:0 }}>Compte créé avec succès !</p>
                <p style={{ fontSize:'13px', color:'#9ca3af', margin:0 }}>Redirection vers la connexion…</p>
              </div>
            ) : (<>
              {renderRegStep()}
              <div style={{ display:'flex', gap:'8px', marginTop:'12px' }}>
                {regStep>1&&<button className="auth-btn-ghost" onClick={()=>{setRegErrors({});setRegStep(regStep-1);}} disabled={regLoading}>← Retour</button>}
                <button className="auth-btn-main" style={{ flex:1 }} onClick={handleRegNext} disabled={regBtnDisabled}>
                  {regLoading&&regStep===3?<><Spinner/>Inscription…</>:regStep===3?<><UserPlus size={17}/>Créer mon compte</>:regStep===2?<>J'accepte <ArrowRight size={16}/></>:<>Continuer <ArrowRight size={16}/></>}
                </button>
              </div>
              <div style={{ marginTop:'16px', paddingTop:'14px', borderTop:`1px solid ${dark?'#3a3a3c':'#f3f4f6'}`, textAlign:'center' }}>
                <p style={{ fontSize:'13px', color:'#9ca3af', margin:0 }}>
                  Déjà un compte ?{' '}
                  <button onClick={()=>switchTo('login')} style={{ background:'none', border:'none', cursor:'pointer', color:'#f97316', fontWeight:700, fontSize:'13px', padding:0, fontFamily:'inherit' }}>Se connecter</button>
                </p>
              </div>
            </>)}
          </div>

        </div>

        <button onClick={()=>router.push('/')} style={{ marginTop:'18px', background:'none', border:'none', cursor:'pointer', color:'#9ca3af', fontSize:'12.5px', fontFamily:'DM Sans,sans-serif', transition:'color .15s' }}
          onMouseEnter={e=>e.target.style.color=dark?'#f5f5f7':'#1a1a1a'} onMouseLeave={e=>e.target.style.color='#9ca3af'}>
          ← Retour à l'accueil
        </button>
      </div>
    </>
  );
}