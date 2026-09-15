// src/components/Footer.jsx
import React, { useEffect, useRef } from 'react';
import {
  Facebook, Instagram, Twitter, Linkedin,
  Phone, Mail, MapPinned,
  Home, Info, HelpCircle, ShieldCheck, ChevronRight,
} from 'lucide-react';

function LogoShopCI({ size = 30 }) {
  return (
    <svg viewBox="0 0 140 34" height={size} fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="34" height="34" rx="8" fill="#f97316"/>
      <path d="M7 11h3l3.5 10h8.5l3-8H11" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="14.5" cy="24.5" r="1.5" fill="white"/>
      <circle cx="21" cy="24.5" r="1.5" fill="white"/>
      <text x="42" y="25" fontFamily="'DM Sans',sans-serif" fontSize="20" fontWeight="800" fill="white" letterSpacing="-0.5">Shop</text>
      <text x="91" y="25" fontFamily="'DM Sans',sans-serif" fontSize="20" fontWeight="800" fill="#f97316" letterSpacing="-0.5">CI</text>
    </svg>
  );
}

const SOCIALS = [
  { href: 'https://facebook.com',  Icon: Facebook,  label: 'Facebook',  color: '#1877F2' },
  { href: 'https://instagram.com', Icon: Instagram, label: 'Instagram', color: '#E1306C' },
  { href: 'https://twitter.com',   Icon: Twitter,   label: 'Twitter',   color: '#1DA1F2' },
  { href: 'https://linkedin.com',  Icon: Linkedin,  label: 'LinkedIn',  color: '#0A66C2' },
];

function ParticlesCanvas({ count = 25 }) {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let raf;
    const setSize = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      canvas.width  = rect?.width  || window.innerWidth;
      canvas.height = rect?.height || 60;
    };
    setSize();
    const particles = Array.from({ length: count }, () => ({
      x: Math.random() * (canvas.width || 800),
      y: Math.random() * (canvas.height || 60),
      r: Math.random() * 1.5 + 0.5,
      dx: (Math.random() - 0.5) * 0.4, dy: (Math.random() - 0.5) * 0.4,
      alpha: Math.random() * 0.3 + 0.15,
      pulse: Math.random() * Math.PI * 2,
    }));
    const draw = () => {
      const W = canvas.width, H = canvas.height;
      /* toujours orange, tous modes */
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
      position:'absolute', top:0, left:0,
      width:'100%', height:'100%',
      pointerEvents:'none', zIndex:1, display:'block',
    }}/>
  );
}

export default function Footer() {
  const annee = new Date().getFullYear();
  return (
    <footer className="ft-root">
      <ParticlesCanvas count={35} />

      {/* ── BANDE SOMBRE : logo + réseaux ── */}
      <div className="ft-band">
        <div className="ft-band-inner">
          <div className="ft-band-left">
            <LogoShopCI size={30} />
            <span className="ft-slogan">La marketplace N°1 de Côte&nbsp;d'Ivoire</span>
          </div>
          <div className="ft-socials">
            {SOCIALS.map(({ href, Icon, label, color }) => (
              <a key={label} href={href} target="_blank" rel="noreferrer"
                 className="ft-social" aria-label={label}
                 style={{ '--sc': color }}>
                <Icon size={16} />
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* ── CORPS ── */}
      <div className="ft-body">

        {/* Col brand */}
        <div className="ft-col ft-col-brand">
          <p className="ft-desc">
            Achetez et vendez en toute confiance. Des milliers de produits livrés partout en Côte&nbsp;d'Ivoire.
          </p>
          <div className="ft-contacts">
            <a href="tel:+22501425077" className="ft-cline">
              <span className="ft-cico"><Phone size={13}/></span>
              <span>+225 01 42 50 77 50</span>
            </a>
            <a href="mailto:contact@shopci.ci" className="ft-cline">
              <span className="ft-cico"><Mail size={13}/></span>
              <span>contact@shopci.ci</span>
            </a>
            <span className="ft-cline">
              <span className="ft-cico"><MapPinned size={13}/></span>
              <span>Abidjan, Plateau — CI</span>
            </span>
          </div>
        </div>

        {/* Col navigation */}
        <div className="ft-col">
          <p className="ft-heading">Navigation</p>
          <a href="/"      className="ft-link"><Home size={13}/><span>Accueil</span><ChevronRight size={11} className="ft-arr"/></a>
          <a href="/about" className="ft-link"><Info size={13}/><span>À propos</span><ChevronRight size={11} className="ft-arr"/></a>
          <a href="/help"  className="ft-link"><HelpCircle size={13}/><span>Aide</span><ChevronRight size={11} className="ft-arr"/></a>
        </div>

        {/* Col légal */}
        <div className="ft-col">
          <p className="ft-heading">Légal</p>
          <a href="/cgu"                 className="ft-link"><ShieldCheck size={13}/><span>CGU</span><ChevronRight size={11} className="ft-arr"/></a>
          <a href="/cgu#confidentialite" className="ft-link"><ShieldCheck size={13}/><span>Confidentialité</span><ChevronRight size={11} className="ft-arr"/></a>
          <a href="/cgu#mentions"        className="ft-link"><Info size={13}/><span>Mentions</span><ChevronRight size={11} className="ft-arr"/></a>
        </div>

      </div>

      {/* ── BOTTOM ── */}
      <div className="ft-bottom">
        <p>© {annee} <strong>ShopCI</strong> — Tous droits réservés</p>

      </div>

      <style>{`
        .ft-root {
          background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 50%, #1a1a1a 100%) !important;
          border-top: 1px solid rgba(255,255,255,0.08);
          font-family: 'DM Sans', system-ui, sans-serif;
          position: relative;
          overflow: hidden;
        }
        body.dark .ft-root {
          background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 50%, #1a1a1a 100%) !important;
        }
        /* Empêcher index.css d'écraser les sous-sections */
        body.dark .ft-band,
        body.dark .ft-band-inner,
        body.dark .ft-body,
        body.dark .ft-col,
        body.dark .ft-col-brand,
        body.dark .ft-bottom {
          background: transparent !important;
          color: inherit !important;
        }

        /* ── BAND ── */
        .ft-band {
          background: transparent;
          border-bottom: 1px solid rgba(255,255,255,0.08);
          padding: 14px 0;
          position: relative;
        }
        .ft-band-inner { position: relative; z-index: 1; }
        .ft-band-inner {
          max-width: 1280px; margin: 0 auto; padding: 0 20px;
          display: flex; align-items: center; justify-content: space-between; gap: 12px;
        }
        .ft-band-left { display: flex; align-items: center; gap: 12px; min-width: 0; }
        .ft-slogan { font-size: 11.5px; color: rgba(255,255,255,.4); white-space: nowrap; }
        .ft-socials { display: flex; gap: 7px; flex-shrink: 0; }
        .ft-social {
          width: 34px; height: 34px; border-radius: 10px;
          background: rgba(255,255,255,.07); border: 1px solid rgba(255,255,255,.1);
          display: flex; align-items: center; justify-content: center;
          color: rgba(255,255,255,.6); text-decoration: none;
          transition: background .2s, border-color .2s, color .2s, transform .2s;
          flex-shrink: 0;
        }
        .ft-social:hover {
          background: var(--sc,#f97316); border-color: var(--sc,#f97316);
          color: #fff; transform: translateY(-2px);
        }

        /* ── BODY ── */
        .ft-body {
          position: relative; z-index: 1;
          max-width: 1280px; margin: 0 auto;
          padding: 28px 20px 20px;
          display: grid;
          grid-template-columns: 2fr 1fr 1fr;
          gap: 24px;
        }
        .ft-col { display: flex; flex-direction: column; gap: 5px; }
        .ft-col-brand { gap: 14px; }

        .ft-desc { font-size: 12.5px; color: rgba(255,255,255,0.5); line-height: 1.65; margin: 0; }

        .ft-contacts { display: flex; flex-direction: column; gap: 9px; }
        .ft-cline {
          display: flex; align-items: center; gap: 9px;
          font-size: 12px; color: rgba(255,255,255,0.55); text-decoration: none; transition: color .18s;
        }
        .ft-cline:hover { color: #f97316; }
        .ft-cico {
          width: 26px; height: 26px; background: rgba(249,115,22,0.15); border-radius: 7px;
          display: flex; align-items: center; justify-content: center;
          color: #f97316; flex-shrink: 0; transition: background .2s, color .2s;
        }
        
        .ft-cline:hover .ft-cico { background: #f97316; color: #fff; }

        .ft-heading {
          font-size: 9.5px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.2px;
          color: rgba(255,255,255,0.9); padding-bottom: 8px;
          border-bottom: 2px solid #f97316; margin: 0 0 5px;
        }
        .ft-link {
          display: flex; align-items: center; gap: 7px;
          font-size: 12.5px; color: rgba(255,255,255,0.55); text-decoration: none;
          padding: 5px 0; transition: color .18s;
        }
        .ft-link span { flex: 1; }
        .ft-arr { color: rgba(255,255,255,0.2); flex-shrink: 0; transition: color .18s, transform .18s; }
        .ft-link:hover { color: #f97316; }
        .ft-link:hover .ft-arr { color: #f97316; transform: translateX(2px); }

        /* ── BOTTOM ── */
        .ft-bottom {
          border-top: 1px solid rgba(255,255,255,0.08);
          padding: 14px 20px;
          display: flex; align-items: center; justify-content: space-between;
          flex-wrap: wrap; gap: 10px;
        }
        .ft-bottom p { font-size: 11.5px; color: rgba(255,255,255,0.4); margin: 0; }
        .ft-bottom p strong { color: #f97316; font-weight: 700; }
        .ft-bottom { border-top: 1px solid rgba(255,255,255,0.08); }

        /* ══════════════════════════════════════════
           MOBILE  ≤ 640px  — layout 1 colonne
        ══════════════════════════════════════════ */
        @media (max-width: 640px) {

          /* Bande sombre */
          .ft-band-inner { padding: 0 16px; }
          .ft-slogan { display: none; }
          .ft-social { width: 38px; height: 38px; } /* cible tactile généreuse */

          /* Body : colonne unique, sections délimitées */
          .ft-body {
            grid-template-columns: 1fr;
            padding: 0;
            gap: 0;
          }
          .ft-col {
            padding: 16px 16px;
            border-bottom: 1px solid var(--border,#f0f4f8);
            gap: 4px;
          }
          .ft-col-brand { gap: 13px; padding: 18px 16px; }

          /* Typographie plus lisible sur mobile */
          .ft-desc { font-size: 13px; }
          .ft-cline { font-size: 13.5px; gap: 10px; }
          .ft-cico  { width: 30px; height: 30px; border-radius: 8px; }
          .ft-heading { font-size: 10px; padding-bottom: 10px; margin-bottom: 7px; }

          /* Liens avec grande zone de tap */
          .ft-link { font-size: 14px; padding: 9px 0; }
          /* Flèche toujours visible (pas de hover sur mobile) */
          .ft-arr { color: rgba(255,255,255,0.25); }

          /* Bottom centré et empilé */
          .ft-bottom {
            flex-direction: column;
            align-items: center;
            text-align: center;
            padding: 16px;
            gap: 10px;
          }
          .ft-bottom p { font-size: 11px; }
        }

        /* Très petits écrans 360px */
        @media (max-width: 360px) {
          .ft-social { width: 34px; height: 34px; }
          .ft-socials { gap: 5px; }
          .ft-band-inner { padding: 0 12px; }
          .ft-col, .ft-col-brand { padding-left: 12px; padding-right: 12px; }
        }
      `}</style>
    </footer>
  );
}