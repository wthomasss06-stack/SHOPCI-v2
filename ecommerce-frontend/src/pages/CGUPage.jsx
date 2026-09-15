'use client';

// src/pages/CGUPage.jsx
// ✅ Informations légales ShopCI — UX/UI aligné HelpPage (hero dark, particles, CSS vars, dark mode)

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  FileText, Shield, Scale, ChevronRight, ChevronDown,
  AlertTriangle, CheckCircle, Lock, Eye,
  Mail, MapPin, Calendar, Info, ExternalLink,
  Phone, MessageCircle,
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

/* ══════════════════════════════════════════════════════════
   PARTICLES CANVAS (identique HelpPage / Footer)
══════════════════════════════════════════════════════════ */
function ParticlesCanvas({ count = 35 }) {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let raf;
    const setSize = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      canvas.width  = rect?.width  || window.innerWidth;
      canvas.height = rect?.height || 400;
    };
    setSize();
    const particles = Array.from({ length: count }, () => ({
      x: Math.random() * (canvas.width || 800),
      y: Math.random() * (canvas.height || 400),
      r: Math.random() * 1.5 + 0.5,
      dx: (Math.random() - 0.5) * 0.4, dy: (Math.random() - 0.5) * 0.4,
      alpha: Math.random() * 0.3 + 0.15,
      pulse: Math.random() * Math.PI * 2,
    }));
    const draw = () => {
      const W = canvas.width, H = canvas.height;
      const cr = 249, cg = 115, cb = 22;
      ctx.clearRect(0, 0, W, H);
      particles.forEach(p => {
        p.x += p.dx; p.y += p.dy; p.pulse += 0.016;
        if (p.x < 0 || p.x > W) p.dx *= -1;
        if (p.y < 0 || p.y > H) p.dy *= -1;
        const a = p.alpha * (0.7 + 0.3 * Math.sin(p.pulse));
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 4);
        grad.addColorStop(0, `rgba(${cr},${cg},${cb},${a})`);
        grad.addColorStop(1, `rgba(${cr},${cg},${cb},0)`);
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 4, 0, Math.PI * 2);
        ctx.fillStyle = grad; ctx.fill();
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${cr},${cg},${cb},${Math.min(a + 0.2, 0.9)})`; ctx.fill();
      });
      raf = requestAnimationFrame(draw);
    };
    draw();
    window.addEventListener('resize', setSize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', setSize); };
  }, [count]);
  return (
    <canvas ref={canvasRef} style={{
      position: 'absolute', top: 0, left: 0,
      width: '100%', height: '100%',
      pointerEvents: 'none', zIndex: 1, display: 'block',
    }}/>
  );
}

/* ── Badge numéro de section ── */
function SectionNum({ n, color = '#6b7280', bg = 'rgba(107,114,128,.12)' }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: 26, height: 26, borderRadius: 7,
      background: bg, color, flexShrink: 0, fontSize: 12, fontWeight: 800,
    }}>{n}</span>
  );
}

/* ── Info / Highlight boxes ── */
function HighlightBox({ color, bg, title, children }) {
  return (
    <div style={{ borderLeft: `4px solid ${color}`, borderRadius: '0 10px 10px 0', padding: '14px 16px', marginBottom: 12, background: bg }}>
      {title && <div style={{ fontSize: 13, fontWeight: 800, color, marginBottom: 5 }}>{title}</div>}
      <p style={{ fontSize: 13, lineHeight: 1.6, margin: 0, color: 'var(--text)' }}>{children}</p>
    </div>
  );
}

function InfoBlock({ children }) {
  return (
    <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 12, padding: 18, marginBottom: 12 }}>
      <p style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.65, margin: 0 }}>{children}</p>
    </div>
  );
}

/* ── Item row ── */
function ItemRow({ icon: Icon, color, children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 10, padding: 12, marginBottom: 6, transition: 'background .15s' }}
      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(249,115,22,.06)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg3)'; }}
    >
      <Icon size={15} color={color} style={{ flexShrink: 0, marginTop: 1 }} />
      <span style={{ fontSize: 13.5, color: 'var(--text)', lineHeight: 1.5 }}>{children}</span>
    </div>
  );
}

function DangerItem({ children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, background: 'rgba(220,38,38,.06)', border: '1px solid rgba(220,38,38,.2)', borderRadius: 10, padding: 12, marginBottom: 6 }}>
      <AlertTriangle size={15} color="#dc2626" style={{ flexShrink: 0, marginTop: 1 }} />
      <span style={{ fontSize: 13.5, color: 'var(--text2)', lineHeight: 1.5 }}>{children}</span>
    </div>
  );
}

function SuccessItem({ children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, background: 'rgba(22,163,74,.06)', border: '1px solid rgba(22,163,74,.2)', borderRadius: 10, padding: 12, marginBottom: 6 }}>
      <CheckCircle size={15} color="#16a34a" style={{ flexShrink: 0, marginTop: 1 }} />
      <span style={{ fontSize: 13.5, color: 'var(--text2)', lineHeight: 1.5 }}>{children}</span>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   PAGE PRINCIPALE
══════════════════════════════════════════════════════════ */
export default function CGUPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('cgu');

  useEffect(() => {
    if (!document.getElementById('cgu-fonts')) {
      const link = document.createElement('link');
      link.id = 'cgu-fonts';
      link.rel = 'stylesheet';
      link.href = 'https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Syne:wght@700;800&display=swap';
      document.head.appendChild(link);
    }
    const hash = window.location.hash.replace('#', '');
    if (['confidentialite', 'mentions'].includes(hash)) {
      setActiveTab(hash);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

  const TABS = [
    { id: 'cgu',             label: 'CGU',              icon: FileText, color: '#f97316', bg: 'rgba(249,115,22,.15)' },
    { id: 'confidentialite', label: 'Confidentialité',  icon: Shield,   color: '#3b82f6', bg: 'rgba(59,130,246,.15)' },
    { id: 'mentions',        label: 'Mentions légales', icon: Scale,    color: '#7e22ce', bg: 'rgba(126,34,206,.15)' },
  ];

  const currentTab = TABS.find(t => t.id === activeTab);

  const handleTab = (id) => {
    setActiveTab(id);
    window.history.replaceState(null, '', id === 'cgu' ? '/cgu' : `/cgu#${id}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Syne:wght@700;800&display=swap');

        .cgu-root, .cgu-root * { font-family:'DM Sans',sans-serif; box-sizing:border-box; }

        @keyframes cgu-hero-in { from { opacity:0; transform:translateY(30px); } to { opacity:1; transform:translateY(0); } }
        @keyframes cgu-fade    { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        @keyframes cgu-float   { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-8px); } }
        @keyframes cgu-pulse   { 0%,100% { box-shadow:0 0 0 0 rgba(249,115,22,0); } 50% { box-shadow:0 0 0 14px rgba(249,115,22,.08); } }

        .cgu-fade-in   { animation: cgu-fade .5s cubic-bezier(.22,1,.36,1) both; }
        .cgu-fade-1 { animation-delay: 60ms; }
        .cgu-fade-2 { animation-delay: 120ms; }
        .cgu-fade-3 { animation-delay: 180ms; }

        /* ── HERO ── */
        .cgu-hero-dark {
          background: linear-gradient(135deg,#1a1a1a 0%,#2a2a2a 50%,#1a1a1a 100%) !important;
          border-bottom: 1px solid rgba(255,255,255,.08);
          position: relative; overflow: hidden;
          padding: 110px 40px 80px; text-align: center;
        }
        .cgu-hero-dark::before {
          content: '';
          position: absolute; inset: 0;
          background:
            radial-gradient(ellipse 70% 60% at 80% 10%, rgba(249,115,22,.18) 0%, transparent 55%),
            radial-gradient(ellipse 50% 60% at 15% 90%, rgba(126,34,206,.12) 0%, transparent 55%);
          pointer-events: none; z-index: 2;
        }
        .cgu-hero-grid {
          position: absolute; inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,.025) 1px, transparent 1px);
          background-size: 52px 52px;
          pointer-events: none; z-index: 2;
        }
        .cgu-hero-icon {
          width: 88px; height: 88px;
          background: rgba(249,115,22,.12);
          border: 1.5px solid rgba(249,115,22,.3);
          border-radius: 22px;
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 28px;
          animation: cgu-pulse 3s ease-in-out infinite, cgu-hero-in .7s ease both;
        }

        /* ── CONTENT ── */
        .cgu-content { max-width: 1024px; margin: 0 auto; padding: 56px 24px 80px; }

        /* ── TABS (HelpPage style) ── */
        .cgu-tabs-hp { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 32px; }
        .cgu-tab-hp {
          display: flex; align-items: center; gap: 7px;
          padding: 9px 16px; border-radius: 10px;
          border: 1.5px solid var(--border);
          background: var(--bg3);
          color: var(--text2);
          font-size: 13px; font-weight: 600;
          cursor: pointer; transition: all .18s;
          font-family: 'DM Sans', sans-serif;
          white-space: nowrap;
        }
        .cgu-tab-hp:hover { border-color: rgba(249,115,22,.4); color: #f97316; background: rgba(249,115,22,.08); }
        .cgu-tab-hp.active { background: rgba(249,115,22,.12); border-color: rgba(249,115,22,.5); color: #f97316; }

        /* ── CARD (HelpPage style) ── */
        .cgu-card {
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 22px;
          padding: 40px;
          box-shadow: 0 2px 16px rgba(0,0,0,.05);
          margin-bottom: 28px;
        }

        /* ── PANEL HEADER ── */
        .cgu-panel-head {
          display: flex; align-items: center; gap: 14px;
          padding-bottom: 24px; margin-bottom: 32px;
          border-bottom: 1px solid var(--border);
        }
        .cgu-panel-head-ico { width: 52px; height: 52px; border-radius: 14px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }

        /* ── BADGE ── */
        .cgu-badge {
          display: inline-flex; align-items: center; gap: 6px;
          background: rgba(249,115,22,.1);
          color: #f97316;
          border: 1px solid rgba(249,115,22,.25);
          border-radius: 999px;
          padding: 5px 13px;
          font-size: 11px; font-weight: 800;
          text-transform: uppercase; letter-spacing: .08em;
          margin-bottom: 14px;
        }

        /* ── SECTION TITLE ── */
        .cgu-sec-title { display: flex; align-items: center; gap: 10px; font-size: 17px; font-weight: 800; color: var(--text); margin-bottom: 14px; font-family: 'DM Sans',sans-serif; }

        /* ── GRID 2 cols ── */
        .cgu-grid2 { display: grid; grid-template-columns: repeat(2,1fr); gap: 8px; }

        /* ── Security 3 cols ── */
        .cgu-security-3 { display: grid; grid-template-columns: repeat(3,1fr); gap: 16px; background: rgba(22,163,74,.07); border: 1px solid rgba(22,163,74,.2); border-radius: 14px; padding: 20px; }
        .cgu-security-col { text-align: center; }

        /* ── Droits 3 cols ── */
        .cgu-droits-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 8px; }
        .cgu-droit-item { background: rgba(59,130,246,.08); border: 1px solid rgba(59,130,246,.2); border-radius: 10px; padding: 12px; text-align: center; transition: background .15s; }
        .cgu-droit-item:hover { background: rgba(59,130,246,.15); }

        /* ── Accept banner ── */
        .cgu-accept-banner { background: rgba(249,115,22,.07); border: 2px solid rgba(249,115,22,.25); border-radius: 14px; padding: 24px; text-align: center; margin-top: 24px; }

        /* ── CONTACT DARK CARD ── */
        .cgu-contact-dark {
          background: linear-gradient(135deg,#1a1a1a 0%,#2a2a2a 50%,#1a1a1a 100%) !important;
          border: 1px solid rgba(255,255,255,.08);
          border-radius: 22px;
          padding: 48px;
          text-align: center;
          position: relative; overflow: hidden;
          margin-top: 8px;
        }
        .cgu-contact-dark::before {
          content: '';
          position: absolute; inset: 0;
          background: radial-gradient(circle at 80% 20%, rgba(249,115,22,.2), transparent 50%),
            radial-gradient(circle at 15% 80%, rgba(126,34,206,.12), transparent 50%);
          pointer-events: none; z-index: 2;
        }
        .cgu-contact-link-dark {
          display: inline-flex; align-items: center; gap: 8px;
          font-size: 14px; color: rgba(255,255,255,.65);
          text-decoration: none;
          background: rgba(255,255,255,.07);
          border: 1px solid rgba(255,255,255,.12);
          padding: 10px 18px; border-radius: 11px;
          transition: all .18s;
        }
        .cgu-contact-link-dark:hover { background: rgba(255,255,255,.12); color: #fff; }

        /* ── RESPONSIVE ── */
        @media (max-width: 900px) {
          .cgu-card { padding: 24px 20px; }
          .cgu-content { padding: 36px 16px 60px; }
          .cgu-hero-dark { padding: 90px 20px 64px; }
          .cgu-contact-dark { padding: 32px 20px; }
        }
        @media (max-width: 640px) {
          .cgu-tabs-hp { gap: 5px; }
          .cgu-tab-hp { padding: 7px 12px; font-size: 12px; }
          .cgu-grid2 { grid-template-columns: 1fr; }
          .cgu-droits-grid { grid-template-columns: repeat(2,1fr); }
          .cgu-security-3 { grid-template-columns: 1fr; }
          .cgu-hero-dark { padding: 80px 16px 56px; }
        }
      `}</style>

      <div className="cgu-root" style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
        <Navbar pageCourante="/cgu" />

        {/* ══════════ HERO ══════════ */}
        <section className="cgu-hero-dark">
          <ParticlesCanvas count={40} />
          <div className="cgu-hero-grid" />
          <div style={{ position: 'relative', zIndex: 3, maxWidth: 800, margin: '0 auto' }}>

            {/* Eyebrow */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 24, animation: 'cgu-hero-in .6s ease both' }}>
              <div style={{ height: 1, width: 28, background: '#f97316', opacity: .7 }} />
              <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#f97316' }}>Documents légaux</span>
              <div style={{ height: 1, width: 28, background: '#f97316', opacity: .7 }} />
            </div>

            {/* Icon dynamique selon onglet actif */}
            <div className="cgu-hero-icon" style={{ background: `${currentTab?.color}18`, borderColor: `${currentTab?.color}35`, animation: 'cgu-pulse 3s ease-in-out infinite, cgu-hero-in .7s ease 80ms both' }}>
              {currentTab && React.createElement(currentTab.icon, { size: 44, color: currentTab.color })}
            </div>

            {/* Title */}
            <h1 style={{
              fontFamily: "'Syne',sans-serif",
              fontSize: 'clamp(32px, 6vw, 60px)',
              fontWeight: 800,
              color: '#fff',
              letterSpacing: '-0.025em',
              lineHeight: 1.05,
              margin: '0 0 16px',
              animation: 'cgu-hero-in .7s ease .12s both',
            }}>
              Informations{' '}
              <span style={{ color: '#f97316', fontStyle: 'italic', fontFamily: 'Georgia, serif', fontWeight: 400 }}>Légales</span>
            </h1>

            <p style={{ fontSize: 16, color: 'rgba(255,255,255,.55)', lineHeight: 1.7, maxWidth: 560, margin: '0 auto 32px', animation: 'cgu-hero-in .7s ease .18s both' }}>
              Conditions d'utilisation, confidentialité et mentions légales de ShopCI
            </p>

            {/* Date badge */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(59,130,246,.15)', border: '1px solid rgba(59,130,246,.35)', borderRadius: 999, padding: '5px 14px', fontSize: 12.5, color: '#93c5fd', fontWeight: 600, animation: 'cgu-hero-in .7s ease .24s both' }}>
              <Calendar size={14} /> Dernière mise à jour : Janvier 2025
            </div>
          </div>
        </section>

        {/* ══════════ CONTENT ══════════ */}
        <main className="cgu-content" style={{ flex: 1 }}>

          {/* ── TABS ── */}
          <div className="cgu-tabs-hp cgu-fade-in">
            {TABS.map(t => (
              <button
                key={t.id}
                className={`cgu-tab-hp${activeTab === t.id ? ' active' : ''}`}
                onClick={() => handleTab(t.id)}
              >
                <t.icon size={15} /> {t.label}
              </button>
            ))}
          </div>

          {/* ══ PANEL CARD ══ */}
          <div className="cgu-card cgu-fade-in cgu-fade-1">

            {/* Panel header */}
            <div className="cgu-panel-head">
              <div className="cgu-panel-head-ico" style={{ background: `${currentTab?.color}18`, border: `1.5px solid ${currentTab?.color}35` }}>
                {currentTab && React.createElement(currentTab.icon, { size: 26, color: currentTab.color })}
              </div>
              <div>
                <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: 22, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em', margin: '0 0 4px' }}>
                  {activeTab === 'cgu' && "Conditions Générales d'Utilisation"}
                  {activeTab === 'confidentialite' && 'Politique de Confidentialité'}
                  {activeTab === 'mentions' && 'Mentions Légales'}
                </h2>
                <p style={{ fontSize: 13.5, color: 'var(--text3)', margin: 0 }}>ShopCI — Côte d'Ivoire · Janvier 2025</p>
              </div>
            </div>

            {/* ═══════════════ CGU ═══════════════ */}
            {activeTab === 'cgu' && (
              <div>
                {/* Section 1 */}
                <div style={{ marginBottom: 32 }}>
                  <div className="cgu-sec-title"><SectionNum n="1" color="#f97316" bg="rgba(249,115,22,.12)"/> Acceptation des CGU</div>
                  <InfoBlock>
                    En accédant à ShopCI et en utilisant nos services, vous acceptez sans réserve les présentes Conditions Générales d'Utilisation. Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser la plateforme.
                  </InfoBlock>
                  <HighlightBox color="#f97316" bg="rgba(249,115,22,.06)" title="Important">
                    L'utilisation de ShopCI implique l'acceptation pleine et entière des présentes CGU. Ces conditions s'appliquent à tous les utilisateurs, qu'ils soient acheteurs ou vendeurs.
                  </HighlightBox>
                </div>

                {/* Section 2 */}
                <div style={{ marginBottom: 32 }}>
                  <div className="cgu-sec-title"><SectionNum n="2" color="#f97316" bg="rgba(249,115,22,.12)"/> Présentation du service</div>
                  <InfoBlock>
                    ShopCI est une plateforme de mise en relation entre acheteurs et vendeurs en Côte d'Ivoire. ShopCI agit exclusivement en tant qu'intermédiaire technique et ne participe pas directement aux transactions entre utilisateurs.
                  </InfoBlock>
                  <div className="cgu-grid2">
                    <ItemRow icon={CheckCircle} color="#16a34a">Service d'intermédiation numérique</ItemRow>
                    <ItemRow icon={CheckCircle} color="#16a34a">Plateforme de mise en relation</ItemRow>
                    <ItemRow icon={CheckCircle} color="#16a34a">Suivi GPS des livraisons en temps réel</ItemRow>
                    <ItemRow icon={CheckCircle} color="#16a34a">Paiement sécurisé à la livraison</ItemRow>
                  </div>
                </div>

                {/* Section 3 */}
                <div style={{ marginBottom: 32 }}>
                  <div className="cgu-sec-title"><SectionNum n="3" color="#f97316" bg="rgba(249,115,22,.12)"/> Inscription et compte utilisateur</div>
                  <InfoBlock>
                    Pour utiliser ShopCI, vous devez créer un compte en fournissant des informations exactes et à jour. Vous êtes responsable de la confidentialité de vos identifiants de connexion.
                  </InfoBlock>
                  <SuccessItem>Fournir des informations véridiques lors de l'inscription</SuccessItem>
                  <SuccessItem>Maintenir la confidentialité de votre mot de passe</SuccessItem>
                  <SuccessItem>Signaler toute utilisation non autorisée de votre compte</SuccessItem>
                  <DangerItem>Il est interdit de créer plusieurs comptes ou d'utiliser un compte tiers</DangerItem>
                  <DangerItem>Il est interdit de partager ses identifiants avec des tiers</DangerItem>
                </div>

                {/* Section 4 */}
                <div style={{ marginBottom: 32 }}>
                  <div className="cgu-sec-title"><SectionNum n="4" color="#f97316" bg="rgba(249,115,22,.12)"/> Obligations des vendeurs</div>
                  <InfoBlock>
                    Tout vendeur utilisant ShopCI s'engage à proposer des produits conformes à leur description, à honorer les commandes reçues et à respecter les délais de livraison annoncés.
                  </InfoBlock>
                  <SuccessItem>Publier des descriptions précises et des photos authentiques</SuccessItem>
                  <SuccessItem>Maintenir les stocks à jour pour éviter les annulations</SuccessItem>
                  <SuccessItem>Honorer toutes les commandes confirmées</SuccessItem>
                  <DangerItem>Il est interdit de vendre des produits contrefaits ou illicites</DangerItem>
                  <DangerItem>Il est interdit d'exiger un paiement hors plateforme</DangerItem>
                </div>

                {/* Section 5 */}
                <div style={{ marginBottom: 32 }}>
                  <div className="cgu-sec-title"><SectionNum n="5" color="#f97316" bg="rgba(249,115,22,.12)"/> Responsabilité de ShopCI</div>
                  <InfoBlock>
                    ShopCI met tout en œuvre pour assurer le bon fonctionnement de la plateforme mais ne peut garantir une disponibilité continue du service. ShopCI ne saurait être tenu responsable des transactions entre utilisateurs.
                  </InfoBlock>
                  <HighlightBox color="#3b82f6" bg="rgba(59,130,246,.06)" title="Limitation de responsabilité">
                    ShopCI intervient comme intermédiaire et n'est pas partie aux contrats conclus entre acheteurs et vendeurs. Les litiges doivent être résolus entre les parties concernées.
                  </HighlightBox>
                </div>

                {/* Section 6 */}
                <div style={{ marginBottom: 32 }}>
                  <div className="cgu-sec-title"><SectionNum n="6" color="#f97316" bg="rgba(249,115,22,.12)"/> Comportements interdits</div>
                  <DangerItem>Toute forme d'escroquerie, de fraude ou de tromperie</DangerItem>
                  <DangerItem>La publication de faux avis ou de contenus trompeurs</DangerItem>
                  <DangerItem>L'utilisation de la plateforme à des fins illicites</DangerItem>
                  <DangerItem>Le harcèlement ou toute forme d'abus envers les autres utilisateurs</DangerItem>
                  <DangerItem>La tentative de contournement des systèmes de sécurité</DangerItem>
                </div>

                {/* Section 7 */}
                <div style={{ marginBottom: 32 }}>
                  <div className="cgu-sec-title"><SectionNum n="7" color="#f97316" bg="rgba(249,115,22,.12)"/> Résiliation et suspension</div>
                  <InfoBlock>
                    ShopCI se réserve le droit de suspendre ou supprimer tout compte en cas de violation des présentes CGU, sans préavis et sans indemnité. L'utilisateur peut également fermer son compte à tout moment.
                  </InfoBlock>
                </div>

                {/* Section 8 */}
                <div style={{ marginBottom: 32 }}>
                  <div className="cgu-sec-title"><SectionNum n="8" color="#f97316" bg="rgba(249,115,22,.12)"/> Droit applicable</div>
                  <HighlightBox color="#f59e0b" bg="rgba(245,158,11,.06)" title="Juridiction">
                    Les présentes CGU sont soumises au droit ivoirien. Tout litige sera soumis aux juridictions compétentes de Côte d'Ivoire, après tentative de résolution amiable.
                  </HighlightBox>
                </div>

                {/* Accept banner */}
                <div className="cgu-accept-banner">
                  <CheckCircle size={32} color="#f97316" style={{ margin: '0 auto 10px', display: 'block' }} />
                  <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)', marginBottom: 6 }}>Acceptation des conditions</h3>
                  <p style={{ fontSize: 13.5, color: 'var(--text2)' }}>
                    En utilisant ShopCI, vous confirmez avoir lu, compris et accepté l'intégralité des présentes Conditions Générales d'Utilisation.
                  </p>
                </div>
              </div>
            )}

            {/* ═══════════════ CONFIDENTIALITÉ ═══════════════ */}
            {activeTab === 'confidentialite' && (
              <div>
                <div style={{ marginBottom: 32 }}>
                  <div className="cgu-sec-title"><SectionNum n="1" color="#3b82f6" bg="rgba(59,130,246,.12)"/> Données collectées</div>
                  <InfoBlock>
                    ShopCI collecte uniquement les données nécessaires au bon fonctionnement du service : informations d'identification, coordonnées, historique des commandes et données de navigation.
                  </InfoBlock>
                  <div className="cgu-grid2">
                    <ItemRow icon={Eye} color="#3b82f6">Nom et prénom</ItemRow>
                    <ItemRow icon={Eye} color="#3b82f6">Adresse e-mail</ItemRow>
                    <ItemRow icon={Eye} color="#3b82f6">Numéro de téléphone (+225)</ItemRow>
                    <ItemRow icon={Eye} color="#3b82f6">Adresse de livraison</ItemRow>
                    <ItemRow icon={Eye} color="#3b82f6">Historique des commandes</ItemRow>
                    <ItemRow icon={Eye} color="#3b82f6">Données de navigation (cookies)</ItemRow>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, background: 'rgba(220,38,38,.06)', border: '1px solid rgba(220,38,38,.2)', borderRadius: 12, padding: '12px 16px', marginTop: 12 }}>
                    <Lock size={15} color="#dc2626" style={{ flexShrink: 0, marginTop: 1 }} />
                    <span style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.55 }}>
                      <strong style={{ color: 'var(--text)' }}>Important :</strong> ShopCI ne collecte ni ne traite aucune donnée bancaire ou sensible.
                    </span>
                  </div>
                </div>

                <div style={{ marginBottom: 32 }}>
                  <div className="cgu-sec-title"><SectionNum n="2" color="#3b82f6" bg="rgba(59,130,246,.12)"/> Utilisation des données</div>
                  <InfoBlock>
                    Vos données sont utilisées exclusivement pour la fourniture des services ShopCI, la prévention des fraudes et l'amélioration de votre expérience utilisateur.
                  </InfoBlock>
                  {["Création et gestion des comptes utilisateurs","Publication et gestion des annonces","Mise en relation entre acheteurs et vendeurs","Prévention des fraudes et usages abusifs","Amélioration continue du service","Respect des obligations légales"].map(item => (
                    <ItemRow key={item} icon={ChevronRight} color="#3b82f6">{item}</ItemRow>
                  ))}
                </div>

                <div style={{ marginBottom: 32 }}>
                  <div className="cgu-sec-title"><SectionNum n="3" color="#3b82f6" bg="rgba(59,130,246,.12)"/> Sécurité et confidentialité</div>
                  <p style={{ fontSize: 14, color: 'var(--text2)', marginBottom: 14 }}>ShopCI met en œuvre toutes les mesures techniques et organisationnelles raisonnables pour garantir la sécurité de vos données.</p>
                  <div className="cgu-security-3">
                    {[{ icon: Lock, text: 'Jamais vendues' }, { icon: Shield, text: 'Jamais louées' }, { icon: CheckCircle, text: 'Protégées' }].map(({ icon: Ico, text }) => (
                      <div key={text} className="cgu-security-col">
                        <Ico size={28} color="#22c55e" style={{ margin: '0 auto 8px', display: 'block' }} />
                        <p style={{ fontSize: 13, fontWeight: 700, color: '#15803d', margin: 0 }}>{text}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ marginBottom: 32 }}>
                  <div className="cgu-sec-title"><SectionNum n="4" color="#3b82f6" bg="rgba(59,130,246,.12)"/> Durée de conservation</div>
                  <InfoBlock>
                    Les données sont conservées pendant la durée d'activité du compte utilisateur ou pour la durée nécessaire au respect des obligations légales. À la suppression du compte, les données sont supprimées ou anonymisées.
                  </InfoBlock>
                </div>

                <div style={{ marginBottom: 32 }}>
                  <div className="cgu-sec-title"><SectionNum n="5" color="#3b82f6" bg="rgba(59,130,246,.12)"/> Vos droits</div>
                  <p style={{ fontSize: 14, color: 'var(--text2)', marginBottom: 12 }}>Conformément à la loi ivoirienne, chaque utilisateur dispose des droits suivants :</p>
                  <div className="cgu-droits-grid" style={{ marginBottom: 12 }}>
                    {["Droit d'accès","Droit de rectification","Droit d'opposition","Droit à l'effacement","Droit à la limitation","Droit à la portabilité"].map(d => (
                      <div key={d} className="cgu-droit-item">
                        <CheckCircle size={16} color="#3b82f6" style={{ margin: '0 auto 6px', display: 'block' }} />
                        <span style={{ fontSize: 12, fontWeight: 600, color: '#1d4ed8' }}>{d}</span>
                      </div>
                    ))}
                  </div>
                  <HighlightBox color="#f97316" bg="rgba(249,115,22,.06)" title="Pour exercer vos droits">
                    Contactez-nous à : <strong>contact@shopci.ci</strong>
                  </HighlightBox>
                </div>
              </div>
            )}

            {/* ═══════════════ MENTIONS LÉGALES ═══════════════ */}
            {activeTab === 'mentions' && (
              <div>
                <div style={{ marginBottom: 32 }}>
                  <div className="cgu-sec-title"><SectionNum n="1" color="#7e22ce" bg="rgba(126,34,206,.12)"/> Éditeur du site</div>
                  <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 12, padding: 18 }}>
                    {[
                      { label: 'Nom du site :', value: 'ShopCI' },
                      { label: 'Activité :', value: 'Plateforme de mise en relation acheteurs et vendeurs' },
                      { label: 'Pays :', value: 'République de Côte d\'Ivoire', icon: MapPin },
                      { label: 'Contact :', value: 'contact@shopci.ci', icon: Mail },
                    ].map((row, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: 'var(--text2)', padding: '7px 0', borderBottom: i < 3 ? '1px solid var(--border)' : 'none' }}>
                        {row.icon && React.createElement(row.icon, { size: 15, color: '#f97316' })}
                        <strong style={{ color: 'var(--text)' }}>{row.label}</strong> {row.value}
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ marginBottom: 32 }}>
                  <div className="cgu-sec-title"><SectionNum n="2" color="#7e22ce" bg="rgba(126,34,206,.12)"/> Statut de la plateforme</div>
                  <p style={{ fontSize: 14, color: 'var(--text2)', marginBottom: 12, lineHeight: 1.6 }}>ShopCI est un prestataire de services numériques agissant exclusivement comme intermédiaire technique de mise en relation.</p>
                  <div className="cgu-grid2">
                    {["ShopCI n'est ni vendeur ni acheteur","ShopCI ne détient aucun produit","ShopCI ne participe pas aux transactions","ShopCI ne garantit pas la conclusion des ventes"].map(item => (
                      <ItemRow key={item} icon={Info} color="#7e22ce">{item}</ItemRow>
                    ))}
                  </div>
                </div>

                <div style={{ marginBottom: 32 }}>
                  <div className="cgu-sec-title"><SectionNum n="3" color="#7e22ce" bg="rgba(126,34,206,.12)"/> Responsabilité éditoriale</div>
                  <InfoBlock>
                    Les contenus publiés (annonces, descriptions, images, prix) sont placés sous la responsabilité exclusive des utilisateurs.
                  </InfoBlock>
                  <InfoBlock>
                    ShopCI se réserve le droit de supprimer tout contenu illicite ou frauduleux et de suspendre ou supprimer un compte en cas de non-respect des CGU.
                  </InfoBlock>
                </div>

                <div style={{ marginBottom: 32 }}>
                  <div className="cgu-sec-title"><SectionNum n="4" color="#7e22ce" bg="rgba(126,34,206,.12)"/> Propriété intellectuelle</div>
                  <HighlightBox color="#f59e0b" bg="rgba(245,158,11,.06)" title="Protection des droits">
                    Tous les éléments du site ShopCI (textes, logo, design, code, base de données) sont protégés par les lois ivoiriennes et internationales relatives à la propriété intellectuelle. <strong>Toute reproduction sans autorisation est strictement interdite.</strong>
                  </HighlightBox>
                </div>

                <div style={{ marginBottom: 32 }}>
                  <div className="cgu-sec-title"><SectionNum n="5" color="#7e22ce" bg="rgba(126,34,206,.12)"/> Droit applicable et juridiction</div>
                  <p style={{ fontSize: 14, color: 'var(--text2)', marginBottom: 12 }}>Les présentes Mentions Légales sont régies par le droit ivoirien.</p>
                  <InfoBlock>
                    <strong style={{ color: 'var(--text)' }}>En cas de litige :</strong> une solution amiable sera privilégiée. À défaut, les juridictions compétentes de Côte d'Ivoire seront seules habilitées.
                  </InfoBlock>
                </div>
              </div>
            )}

          </div>

          {/* ══ CONTACT DARK CARD ══ */}
          <div className="cgu-contact-dark cgu-fade-in cgu-fade-2">
            <ParticlesCanvas count={30} />
            <div style={{ position: 'relative', zIndex: 3 }}>
              <div style={{ width: 60, height: 60, borderRadius: 16, background: 'rgba(249,115,22,.18)', border: '1.5px solid rgba(249,115,22,.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', animation: 'cgu-float 3.5s ease-in-out infinite' }}>
                <MessageCircle size={28} color="#f97316" />
              </div>
              <h3 style={{ fontFamily: "'Syne',sans-serif", fontSize: 24, fontWeight: 800, color: '#fff', margin: '0 0 10px', letterSpacing: '-0.02em' }}>
                Une question légale ?
              </h3>
              <p style={{ fontSize: 15, color: 'rgba(255,255,255,.55)', lineHeight: 1.7, maxWidth: 520, margin: '0 auto 32px' }}>
                Notre équipe ShopCI est disponible pour répondre à toutes vos questions juridiques et légales.
              </p>
              <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
                {[
                  { icon: Mail,   label: 'contact@shopci.ci',      href: 'mailto:contact@shopci.ci', color: '#3b82f6' },
                  { icon: Phone,  label: '+225 01 42 50 77 50',     href: 'tel:+22501425077',         color: '#f97316' },
                  { icon: MapPin, label: 'Abidjan, Plateau — CI',   href: '#',                         color: '#16a34a' },
                ].map((c, i) => (
                  <a key={i} href={c.href} className="cgu-contact-link-dark">
                    <c.icon size={17} color={c.color} /> {c.label}
                  </a>
                ))}
              </div>

              {/* Nav links */}
              <div style={{ marginTop: 28, display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                {[
                  { label: 'Accueil ShopCI', action: () => router.push('/') },
                  { label: 'Centre d\'aide',  action: () => router.push('/help') },
                  { label: 'À propos',        action: () => router.push('/about') },
                ].map((link, i) => (
                  <button key={i} onClick={link.action}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: '#f97316', background: 'rgba(249,115,22,.12)', border: '1.5px solid rgba(249,115,22,.3)', padding: '8px 16px', borderRadius: 10, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", transition: 'all .18s' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(249,115,22,.2)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(249,115,22,.12)'; }}
                  >
                    {link.label} <ExternalLink size={12} />
                  </button>
                ))}
              </div>
            </div>
          </div>

        </main>

        <Footer />
      </div>
    </>
  );
}