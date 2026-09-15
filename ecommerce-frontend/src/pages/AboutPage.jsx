'use client';

// ecommerce-frontend/src/pages/AboutPage.jsx
// ✅ À propos de ShopCI — UX/UI aligné HelpPage (hero dark, particles, CSS vars, dark mode)

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users, Target, Heart, Award, Globe, Shield,
  Zap, TrendingUp, Package, Star, CheckCircle,
  ArrowRight, MapPin, Mail, Phone, Linkedin,
  Twitter, Instagram, Facebook, Store, ShoppingBag,
  Truck, Headphones, Lock, ThumbsUp, Info, AlertTriangle,
  BookOpen, Clock, MessageCircle, FileText, ExternalLink
} from 'lucide-react';
import mbolloPhoto from '../assets/mbollo.jpg';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Loader from '../components/Loader';

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

/* ══════════════════════════════════════════════════════════
   DATA
══════════════════════════════════════════════════════════ */
const VALUES = [
  { icon: Shield,  title: 'Confiance & Sécurité',      desc: 'Chaque transaction est protégée. Nous vérifions nos vendeurs et sécurisons vos paiements pour une expérience sans risque.', color: '#2563eb' },
  { icon: Heart,   title: 'Proximité & Authenticité',   desc: 'ShopCI valorise les artisans, PME et entrepreneurs locaux ivoiriens. Acheter ici, c\'est soutenir l\'économie locale.',   color: '#ef4444' },
  { icon: Zap,     title: 'Innovation & Rapidité',      desc: 'Une plateforme moderne, des livraisons rapides, et une expérience utilisateur pensée pour votre quotidien.',               color: '#f97316' },
  { icon: Globe,   title: 'Accessibilité & Inclusion',  desc: 'ShopCI est conçu pour tous : que vous soyez à Abidjan, à Bouaké ou dans toute la Côte d\'Ivoire.',                        color: '#16a34a' },
];

const TEAM = [
  { name: 'Mbollo aka', role: 'Fondateur & Développeur', initials: 'MA', color: '#f97316', photo: mbolloPhoto },
];

const MILESTONES = [
  { year: '2021', event: 'Création de ShopCI à Abidjan avec une vision : digitaliser le commerce ivoirien.' },
  { year: '2022', event: 'Lancement de la plateforme avec 50 vendeurs partenaires pionniers.' },
  { year: '2023', event: 'Franchissement du cap des 10 000 clients et 500 vendeurs actifs.' },
  { year: '2024', event: 'Expansion dans toutes les villes de Côte d\'Ivoire et lancement de l\'application mobile.' },
  { year: '2025', event: 'Plus de 50 000 clients satisfaits et 1 200 vendeurs partenaires sur la plateforme.' },
];

const GUARANTEES = [
  { icon: Shield,      label: 'Paiements sécurisés',  desc: 'Cryptage SSL, aucune donnée bancaire stockée' },
  { icon: Truck,       label: 'Livraison fiable',      desc: 'Suivi en temps réel, délais garantis'         },
  { icon: Headphones,  label: 'Support 7j/7',          desc: 'Une équipe dédiée toujours disponible'        },
  { icon: Lock,        label: 'Données protégées',     desc: 'Conformité RGPD, confidentialité totale'      },
  { icon: ThumbsUp,    label: 'Vendeurs vérifiés',     desc: 'Processus de validation rigoureux'            },
  { icon: ShoppingBag, label: 'Retours facilités',     desc: '30 jours pour changer d\'avis'               },
];

/* ─── Avatar avec fallback ─── */
function TeamAvatar({ photo, initials, color, name }) {
  const [imgError, setImgError] = useState(false);
  if (photo && !imgError) {
    return (
      <img src={photo} alt={name}
        style={{ width: 90, height: 90, borderRadius: '50%', objectFit: 'cover', border: '3px solid rgba(249,115,22,.25)', boxShadow: '0 0 0 3px rgba(249,115,22,.15)', display: 'block' }}
        onError={() => setImgError(true)}
      />
    );
  }
  return (
    <div style={{ width: 90, height: 90, borderRadius: '50%', background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, fontWeight: 800, color: '#fff', border: '3px solid rgba(249,115,22,.25)', boxShadow: '0 0 0 3px rgba(249,115,22,.15)' }}>
      {initials}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   PAGE PRINCIPALE
══════════════════════════════════════════════════════════ */
export default function AboutPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!document.getElementById('about-fonts')) {
      const link = document.createElement('link');
      link.id = 'about-fonts';
      link.rel = 'stylesheet';
      link.href = 'https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Syne:wght@700;800&display=swap';
      document.head.appendChild(link);
    }
    const t = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(t);
  }, []);

  if (loading) return <Loader message="Chargement de la page À propos…" />;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Syne:wght@700;800&display=swap');

        .ap-root, .ap-root * { font-family: 'DM Sans', sans-serif; box-sizing: border-box; }

        @keyframes ap-hero-in  { from { opacity:0; transform:translateY(30px); } to { opacity:1; transform:translateY(0); } }
        @keyframes ap-fade     { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        @keyframes ap-float    { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-8px); } }
        @keyframes ap-pulse    { 0%,100% { box-shadow:0 0 0 0 rgba(249,115,22,0); } 50% { box-shadow:0 0 0 14px rgba(249,115,22,.08); } }

        .ap-fade   { animation: ap-fade .5s cubic-bezier(.22,1,.36,1) both; }
        .ap-fade-1 { animation-delay: 60ms; }
        .ap-fade-2 { animation-delay: 120ms; }
        .ap-fade-3 { animation-delay: 180ms; }

        /* ── HERO ── */
        .ap-hero {
          background: linear-gradient(135deg,#1a1a1a 0%,#2a2a2a 50%,#1a1a1a 100%) !important;
          border-bottom: 1px solid rgba(255,255,255,.08);
          position: relative; overflow: hidden;
          padding: 110px 40px 80px; text-align: center;
        }
        .ap-hero::before {
          content: '';
          position: absolute; inset: 0;
          background:
            radial-gradient(ellipse 70% 60% at 80% 10%, rgba(249,115,22,.18) 0%, transparent 55%),
            radial-gradient(ellipse 50% 60% at 15% 90%, rgba(59,130,246,.12) 0%, transparent 55%);
          pointer-events: none; z-index: 2;
        }
        .ap-hero-grid {
          position: absolute; inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,.025) 1px, transparent 1px);
          background-size: 52px 52px;
          pointer-events: none; z-index: 2;
        }
        .ap-hero-icon {
          width: 88px; height: 88px;
          background: rgba(249,115,22,.12);
          border: 1.5px solid rgba(249,115,22,.3);
          border-radius: 22px;
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 28px;
          animation: ap-pulse 3s ease-in-out infinite, ap-hero-in .7s ease both;
        }

        /* ── CONTENT ── */
        .ap-content { max-width: 1000px; margin: 0 auto; padding: 56px 24px 80px; display: flex; flex-direction: column; gap: 28px; }

        /* ── CARD ── */
        .ap-card {
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 22px;
          padding: 40px;
          box-shadow: 0 2px 16px rgba(0,0,0,.05);
        }

        /* ── SECTION BADGE ── */
        .ap-badge {
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

        /* ── SECTION HEADER ── */
        .ap-section-head { display: flex; align-items: flex-start; gap: 16px; margin-bottom: 28px; }
        .ap-section-head-ico { width: 52px; height: 52px; border-radius: 14px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }

        /* ── INFO BOX ── */
        .ap-infobox {
          display: flex; gap: 12px;
          background: rgba(59,130,246,.08);
          border: 1px solid rgba(59,130,246,.25);
          border-left: 4px solid #3b82f6;
          border-radius: 12px;
          padding: 14px 16px;
          margin: 14px 0;
        }
        .ap-warnbox {
          display: flex; gap: 12px;
          background: rgba(245,158,11,.08);
          border: 1px solid rgba(245,158,11,.3);
          border-left: 4px solid #f59e0b;
          border-radius: 12px;
          padding: 14px 16px;
          margin: 14px 0;
        }

        /* ── ITEMS GRID ── */
        .ap-items-grid { display: grid; grid-template-columns: repeat(2,1fr); gap: 10px; margin-top: 16px; }
        .ap-item {
          display: flex; align-items: flex-start; gap: 14px;
          background: var(--bg3); border: 1px solid var(--border);
          border-radius: 12px; padding: 16px;
          transition: border-color .2s, transform .2s;
        }
        .ap-item:hover { border-color: rgba(249,115,22,.3); transform: translateY(-2px); }
        .ap-item-ico { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }

        /* ── CHECKS ── */
        .ap-checks { display: flex; flex-direction: column; gap: 10px; margin-top: 16px; }
        .ap-check {
          display: flex; align-items: flex-start; gap: 14px;
          background: var(--bg3); border: 1px solid var(--border);
          border-radius: 12px; padding: 14px 16px;
          transition: border-color .2s;
        }
        .ap-check:hover { border-color: rgba(249,115,22,.3); }

        /* ── TIMELINE ── */
        .ap-timeline { display: flex; flex-direction: column; margin-top: 20px; }
        .ap-tl-item { display: grid; grid-template-columns: 52px 20px 1fr; gap: 12px; align-items: flex-start; }
        .ap-tl-year { font-size: 14px; font-weight: 800; color: #f97316; text-align: right; padding-top: 3px; }
        .ap-tl-connector { display: flex; flex-direction: column; align-items: center; }
        .ap-tl-dot { width: 13px; height: 13px; background: #f97316; border-radius: 50%; border: 3px solid rgba(249,115,22,.2); flex-shrink: 0; position: relative; z-index: 1; }
        .ap-tl-line { width: 2px; flex: 1; min-height: 24px; background: linear-gradient(to bottom, #f97316, transparent); opacity: .35; margin-top: 2px; }
        .ap-tl-content { font-size: 13.5px; color: var(--text2); line-height: 1.6; padding-top: 2px; padding-bottom: 20px; }

        /* ── TEAM ── */
        .ap-team-card {
          display: flex; flex-direction: column; align-items: center;
          background: var(--bg3); border: 1.5px solid var(--border);
          border-radius: 16px; padding: 32px 40px;
          text-align: center; min-width: 240px;
          transition: border-color .2s, box-shadow .2s;
        }
        .ap-team-card:hover { border-color: rgba(249,115,22,.35); box-shadow: 0 6px 20px rgba(249,115,22,.08); }

        /* ── GUARANTEES ── */
        .ap-guarantee-grid { display: grid; grid-template-columns: repeat(2,1fr); gap: 10px; margin-top: 16px; }
        .ap-guarantee {
          display: flex; align-items: flex-start; gap: 12px;
          background: var(--bg3); border: 1px solid var(--border);
          border-radius: 12px; padding: 14px 16px;
          transition: border-color .2s;
        }
        .ap-guarantee:hover { border-color: rgba(249,115,22,.3); }
        .ap-guarantee-ico { width: 36px; height: 36px; background: rgba(249,115,22,.1); border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }

        /* ── CONTACT DARK CARD ── */
        .ap-contact-card {
          background: linear-gradient(135deg,#1a1a1a 0%,#2a2a2a 50%,#1a1a1a 100%) !important;
          border: 1px solid rgba(255,255,255,.08);
          border-radius: 22px;
          padding: 48px;
          position: relative; overflow: hidden;
          margin-top: 8px;
        }
        .ap-contact-card::before {
          content: '';
          position: absolute; inset: 0;
          background: radial-gradient(circle at 80% 20%, rgba(249,115,22,.2), transparent 50%),
            radial-gradient(circle at 15% 80%, rgba(59,130,246,.12), transparent 50%);
          pointer-events: none; z-index: 2;
        }

        /* ── CONTACT LINKS ── */
        .ap-contact-link {
          display: inline-flex; align-items: center; gap: 8px;
          font-size: 14px; color: rgba(255,255,255,.65);
          text-decoration: none;
          background: rgba(255,255,255,.07);
          border: 1px solid rgba(255,255,255,.12);
          padding: 10px 18px; border-radius: 11px;
          transition: all .18s;
        }
        .ap-contact-link:hover { background: rgba(255,255,255,.12); color: #fff; }

        /* ── CONTACT LAYOUT ── */
        .ap-contact-inner { display: grid; grid-template-columns: 1fr 1.3fr; gap: 24px; margin-top: 28px; align-items: start; position: relative; z-index: 3; }
        .ap-contact-infos { display: flex; flex-direction: column; gap: 10px; }
        .ap-contact-item {
          display: flex; align-items: center; gap: 12px;
          background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.1);
          border-radius: 12px; padding: 13px 16px;
          transition: border-color .2s;
        }
        .ap-contact-item:hover { border-color: rgba(249,115,22,.4); }
        .ap-contact-label { font-size: 11px; color: rgba(255,255,255,.4); font-weight: 600; text-transform: uppercase; letter-spacing: .4px; margin-bottom: 2px; }
        .ap-contact-value { font-size: 14px; font-weight: 700; color: #fff; }

        /* Social */
        .ap-social-row { display: flex; gap: 8px; }
        .ap-social-btn {
          width: 38px; height: 38px;
          background: rgba(255,255,255,.07); border: 1px solid rgba(255,255,255,.12);
          border-radius: 10px; display: flex; align-items: center; justify-content: center;
          color: rgba(255,255,255,.5); cursor: pointer; transition: all .15s;
        }
        .ap-social-btn:hover { background: rgba(249,115,22,.15); border-color: rgba(249,115,22,.4); color: #f97316; }

        /* Map */
        .ap-map-wrap { border: 1px solid rgba(255,255,255,.1); border-radius: 14px; overflow: hidden; background: rgba(255,255,255,.04); }
        .ap-map-header { display: flex; align-items: center; gap: 6px; padding: 10px 14px; font-size: 12.5px; font-weight: 600; color: rgba(255,255,255,.5); background: rgba(255,255,255,.06); border-bottom: 1px solid rgba(255,255,255,.08); }
        .ap-map-cta { display: flex; align-items: center; justify-content: center; gap: 6px; padding: 10px; font-size: 12.5px; font-weight: 600; color: #f97316; text-decoration: none; background: rgba(255,255,255,.06); border-top: 1px solid rgba(255,255,255,.08); transition: background .15s; }
        .ap-map-cta:hover { background: rgba(249,115,22,.1); }

        /* ── LEGAL ── */
        .ap-legal { display: flex; align-items: center; gap: 8px; justify-content: center; font-size: 13px; color: var(--text3); flex-wrap: wrap; padding-top: 4px; }
        .ap-legal a { color: #f97316; text-decoration: none; font-weight: 600; }
        .ap-legal a:hover { text-decoration: underline; }

        /* ── BUTTONS ── */
        .ap-btn-primary { display: inline-flex; align-items: center; gap: 7px; background: #f97316; color: #fff; border: none; border-radius: 10px; padding: 11px 22px; font-size: 14px; font-weight: 700; cursor: pointer; transition: background .15s, transform .12s; font-family: 'DM Sans',sans-serif; }
        .ap-btn-primary:hover { background: #ea6a0a; transform: translateY(-1px); }
        .ap-btn-secondary { display: inline-flex; align-items: center; gap: 7px; background: rgba(249,115,22,.12); color: #f97316; border: 1.5px solid rgba(249,115,22,.3); border-radius: 10px; padding: 9px 18px; font-size: 13px; font-weight: 700; cursor: pointer; transition: all .18s; font-family: 'DM Sans',sans-serif; }
        .ap-btn-secondary:hover { background: rgba(249,115,22,.2); }

        /* ── RESPONSIVE ── */
        @media (max-width: 900px) {
          .ap-contact-inner { grid-template-columns: 1fr; }
          .ap-card { padding: 24px 20px; }
          .ap-content { padding: 36px 16px 60px; gap: 20px; }
          .ap-hero { padding: 90px 20px 64px; }
          .ap-contact-card { padding: 32px 20px; }
        }
        @media (max-width: 640px) {
          .ap-items-grid { grid-template-columns: 1fr; }
          .ap-guarantee-grid { grid-template-columns: 1fr; }
          .ap-hero { padding: 80px 16px 56px; }
          .ap-hero-icon { width: 72px; height: 72px; }
        }
      `}</style>

      <div className="ap-root" style={{ minHeight: '100vh', background: 'var(--bg)' }}>
        <Navbar pageCourante="/about" />

        {/* ══════════ HERO ══════════ */}
        <section className="ap-hero">
          <ParticlesCanvas count={40} />
          <div className="ap-hero-grid" />
          <div style={{ position: 'relative', zIndex: 3, maxWidth: 800, margin: '0 auto' }}>

            {/* Eyebrow */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 24, animation: 'ap-hero-in .6s ease both' }}>
              <div style={{ height: 1, width: 28, background: '#f97316', opacity: .7 }} />
              <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#f97316' }}>À propos de nous</span>
              <div style={{ height: 1, width: 28, background: '#f97316', opacity: .7 }} />
            </div>

            {/* Icon */}
            <div className="ap-hero-icon" style={{ animation: 'ap-pulse 3s ease-in-out infinite, ap-hero-in .7s ease 80ms both' }}>
              <ShoppingBag size={44} color="#f97316" />
            </div>

            {/* Title */}
            <h1 style={{
              fontFamily: "'Syne',sans-serif",
              fontSize: 'clamp(36px, 7vw, 68px)',
              fontWeight: 800,
              color: '#fff',
              letterSpacing: '-0.025em',
              lineHeight: 1.0,
              margin: '0 0 16px',
              animation: 'ap-hero-in .7s ease .12s both',
            }}>
              À propos de{' '}
              <span style={{ color: '#f97316', fontStyle: 'italic', fontFamily: 'Georgia, serif', fontWeight: 400 }}>ShopCI</span>
            </h1>

            <p style={{ fontSize: 17, color: 'rgba(255,255,255,.55)', lineHeight: 1.7, maxWidth: 580, margin: '0 auto 40px', animation: 'ap-hero-in .7s ease .18s both' }}>
              Depuis 2021, nous connectons vendeurs locaux et acheteurs passionnés dans toute la Côte d'Ivoire, avec confiance, simplicité et innovation.
            </p>

            {/* CTA buttons */}
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', animation: 'ap-hero-in .7s ease .24s both' }}>
              <button className="ap-btn-primary" style={{ padding: '13px 28px', fontSize: 15 }}
                onClick={() => { router.push('/'); setTimeout(() => { const el = document.getElementById('produits-disponibles'); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 300); }}
              >
                Découvrir nos produits <ArrowRight size={15} />
              </button>
              <button className="ap-btn-secondary" style={{ padding: '12px 24px', fontSize: 14, background: 'rgba(249,115,22,.12)', border: '1.5px solid rgba(249,115,22,.3)' }}
                onClick={() => router.push('/login')}
              >
                Devenir vendeur <ExternalLink size={13} />
              </button>
            </div>
          </div>
        </section>

        {/* ══════════ CONTENT ══════════ */}
        <div className="ap-content">

          {/* ── MISSION ── */}
          <div className="ap-card ap-fade ap-fade-1">
            <div className="ap-badge"><Info size={12} /> Notre mission</div>
            <div className="ap-section-head">
              <div className="ap-section-head-ico" style={{ background: 'rgba(59,130,246,.1)', border: '1.5px solid rgba(59,130,246,.25)' }}>
                <Target size={24} color="#3b82f6" />
              </div>
              <div>
                <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: 24, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em', margin: '0 0 4px' }}>
                  Ce que nous construisons
                </h2>
                <p style={{ fontSize: 14, color: 'var(--text3)', margin: 0 }}>La marketplace ivoirienne de référence</p>
              </div>
            </div>
            <p style={{ fontSize: 14.5, color: 'var(--text2)', lineHeight: 1.75, margin: '0 0 16px' }}>
              ShopCI est née d'une conviction simple : chaque Ivoirien mérite d'accéder aux meilleurs produits locaux facilement, et chaque entrepreneur mérite une vitrine digitale digne de son talent. Nous bâtissons un écosystème où vendeurs et acheteurs se retrouvent dans un environnement sécurisé, fluide et ancré dans les réalités de notre pays.
            </p>
            <div className="ap-warnbox">
              <AlertTriangle size={18} color="#d97706" style={{ flexShrink: 0, marginTop: 2 }} />
              <div style={{ fontSize: 13.5, color: 'var(--text)', lineHeight: 1.7 }}>
                ShopCI facilite la mise en relation — les transactions se font directement entre acheteurs et vendeurs.
              </div>
            </div>
          </div>

          {/* ── ENGAGEMENTS ── */}
          <div className="ap-card ap-fade ap-fade-2">
            <div className="ap-badge"><CheckCircle size={12} /> Nos engagements</div>
            <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: 22, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em', margin: '0 0 4px' }}>
              Ce que nous nous engageons à faire
            </h2>
            <div className="ap-checks">
              {[
                { icon: CheckCircle, color: '#16a34a', bg: 'rgba(22,163,74,.1)', label: 'Soutenir l\'économie locale', desc: 'Chaque achat sur ShopCI profite à un entrepreneur ivoirien.' },
                { icon: Shield,      color: '#2563eb', bg: 'rgba(37,99,235,.1)', label: 'Garantir la sécurité',       desc: 'Vendeurs vérifiés, paiements sécurisés, données protégées.' },
                { icon: Star,        color: '#f97316', bg: 'rgba(249,115,22,.1)', label: 'Offrir une expérience premium', desc: 'Interface fluide, support réactif, livraison rapide.' },
              ].map((item, i) => (
                <div key={i} className="ap-check">
                  <div style={{ width: 38, height: 38, background: item.bg, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <item.icon size={20} color={item.color} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)', marginBottom: 3 }}>{item.label}</div>
                    <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.5 }}>{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── VALEURS ── */}
          <div className="ap-card ap-fade ap-fade-3">
            <div className="ap-badge"><Heart size={12} /> Nos valeurs</div>
            <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: 22, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em', margin: '0 0 20px' }}>
              Ce qui nous guide au quotidien
            </h2>
            <div className="ap-items-grid">
              {VALUES.map((v, i) => (
                <div key={i} className="ap-item">
                  <div className="ap-item-ico" style={{ background: `${v.color}15`, border: `1.5px solid ${v.color}25` }}>
                    <v.icon size={20} color={v.color} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)', marginBottom: 4 }}>{v.title}</div>
                    <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.55 }}>{v.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── TIMELINE ── */}
          <div className="ap-card ap-fade">
            <div className="ap-badge"><TrendingUp size={12} /> Notre parcours</div>
            <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: 22, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em', margin: '0 0 4px' }}>
              Les étapes clés de ShopCI
            </h2>
            <div className="ap-timeline">
              {MILESTONES.map((m, i) => (
                <div key={i} className="ap-tl-item">
                  <div className="ap-tl-year">{m.year}</div>
                  <div className="ap-tl-connector">
                    <div className="ap-tl-dot" />
                    {i < MILESTONES.length - 1 && <div className="ap-tl-line" />}
                  </div>
                  <div className="ap-tl-content">{m.event}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ── ÉQUIPE ── */}
          <div className="ap-card ap-fade">
            <div className="ap-badge"><Users size={12} /> Notre équipe</div>
            <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: 22, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em', margin: '0 0 6px' }}>
              Les visages derrière ShopCI
            </h2>
            <p style={{ fontSize: 14, color: 'var(--text3)', margin: '0 0 24px' }}>Une équipe passionnée, diversifiée et 100 % ivoirienne.</p>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              {TEAM.map((m, i) => (
                <div key={i} className="ap-team-card">
                  <div style={{ marginBottom: 14 }}>
                    <TeamAvatar photo={m.photo} initials={m.initials} color={m.color} name={m.name} />
                  </div>
                  <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 18, fontWeight: 800, color: 'var(--text)', marginBottom: 5 }}>{m.name}</div>
                  <div style={{ fontSize: 13.5, color: '#f97316', fontWeight: 600 }}>{m.role}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ── GARANTIES ── */}
          <div className="ap-card ap-fade">
            <div className="ap-badge"><Award size={12} /> Garanties</div>
            <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: 22, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em', margin: '0 0 4px' }}>
              Votre satisfaction, notre priorité
            </h2>
            <div className="ap-guarantee-grid">
              {GUARANTEES.map((g, i) => (
                <div key={i} className="ap-guarantee">
                  <div className="ap-guarantee-ico">
                    <g.icon size={18} color="#f97316" />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--text)', marginBottom: 3 }}>{g.label}</div>
                    <div style={{ fontSize: 12.5, color: 'var(--text2)' }}>{g.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── CONTACT DARK CARD ── */}
          <div className="ap-contact-card ap-fade">
            <ParticlesCanvas count={30} />
            <div style={{ position: 'relative', zIndex: 3, textAlign: 'center' }}>
              <div style={{ width: 60, height: 60, borderRadius: 16, background: 'rgba(249,115,22,.18)', border: '1.5px solid rgba(249,115,22,.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', animation: 'ap-float 3.5s ease-in-out infinite' }}>
                <MessageCircle size={28} color="#f97316" />
              </div>
              <h3 style={{ fontFamily: "'Syne',sans-serif", fontSize: 24, fontWeight: 800, color: '#fff', margin: '0 0 10px', letterSpacing: '-0.02em' }}>
                Venez nous retrouver
              </h3>
              <p style={{ fontSize: 15, color: 'rgba(255,255,255,.55)', lineHeight: 1.7, maxWidth: 520, margin: '0 auto 0' }}>
                Notre équipe est disponible 7j/7 pour vous accompagner.
              </p>
            </div>

            <div className="ap-contact-inner">
              {/* Infos */}
              <div className="ap-contact-infos">
                {[
                  { icon: Mail,   color: '#16a34a', label: 'E-mail',           value: 'contact@shopci.ci',    href: 'mailto:contact@shopci.ci' },
                  { icon: Phone,  color: '#f97316', label: 'Téléphone',         value: '+225 01 42 50 77 50',  href: 'tel:+22501425077' },
                  { icon: MapPin, color: '#3b82f6', label: 'Adresse',           value: 'Plateau, Abidjan, CI', href: null },
                  { icon: Clock,  color: '#8b5cf6', label: 'Délai de réponse',  value: 'Moins de 24h',         href: null },
                ].map((c, i) => (
                  <div key={i} className="ap-contact-item">
                    <div style={{ width: 36, height: 36, background: `${c.color}20`, border: `1px solid ${c.color}30`, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <c.icon size={16} color={c.color} />
                    </div>
                    <div>
                      <div className="ap-contact-label">{c.label}</div>
                      {c.href
                        ? <a href={c.href} style={{ fontSize: 14, fontWeight: 700, color: '#f97316', textDecoration: 'none' }}>{c.value}</a>
                        : <div className="ap-contact-value">{c.value}</div>
                      }
                    </div>
                  </div>
                ))}

                {/* Social */}
                <div className="ap-social-row">
                  {[
                    { Icon: Facebook, label: 'Facebook' }, { Icon: Instagram, label: 'Instagram' },
                    { Icon: Twitter,  label: 'Twitter'  }, { Icon: Linkedin,  label: 'LinkedIn'  },
                  ].map(({ Icon, label }, i) => (
                    <button key={i} className="ap-social-btn" title={label}><Icon size={17} /></button>
                  ))}
                </div>

                <button className="ap-btn-secondary" style={{ width: '100%', justifyContent: 'center', marginTop: 4 }} onClick={() => router.push('/help')}>
                  Centre d'aide <ExternalLink size={12} />
                </button>
              </div>

              {/* Carte */}
              <div className="ap-map-wrap">
                <div className="ap-map-header">
                  <MapPin size={14} style={{ color: '#f97316' }} />
                  <span>Plateau, Abidjan — Côte d'Ivoire</span>
                </div>
                <div style={{ height: 260, width: '100%' }}>
                  <iframe
                    title="ShopCI localisation"
                    src="https://www.openstreetmap.org/export/embed.html?bbox=-4.042,5.310,-3.992,5.335&layer=mapnik&marker=5.3215,-4.0166"
                    width="100%" height="100%"
                    style={{ border: 0 }}
                    loading="lazy"
                  />
                </div>
                <a href="https://maps.google.com/?q=Plateau,Abidjan,Cote+d'Ivoire" target="_blank" rel="noopener noreferrer" className="ap-map-cta">
                  <MapPin size={13} /> Ouvrir dans Google Maps
                </a>
              </div>
            </div>

            {/* Nav links */}
            <div style={{ marginTop: 28, display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', position: 'relative', zIndex: 3 }}>
              {[
                { label: 'Accueil ShopCI', action: () => router.push('/') },
                { label: 'Mes commandes',  action: () => router.push('/orders') },
                { label: 'Mon panier',      action: () => router.push('/cart') },
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

          {/* ── LEGAL ── */}
          <div className="ap-legal">
            <FileText size={14} />
            <span>Documents légaux :</span>
            <a href="/cgu">CGU</a>
            <span style={{ color: 'var(--text3)' }}>•</span>
            <a href="/cgu#confidentialite">Confidentialité</a>
            <span style={{ color: 'var(--text3)' }}>•</span>
            <a href="/cgu#mentions">Mentions Légales</a>
          </div>

        </div>

        <Footer />
      </div>
    </>
  );
}