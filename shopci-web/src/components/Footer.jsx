// src/components/Footer.jsx
import React from 'react';
import {
  Facebook, Instagram, Twitter, Linkedin,
  Phone, Mail, MapPinned,
  Home, Info, HelpCircle, ShieldCheck, ChevronRight,
} from 'lucide-react';
import PwaInstallButton from './PwaInstallButton';

function LogoShopCI({ size = 30 }) {
  return (
    <svg viewBox="0 0 140 34" height={size} fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="34" height="34" rx="8" fill="#f97316"/>
      <path d="M7 11h3l3.5 10h8.5l3-8H11" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="14.5" cy="24.5" r="1.5" fill="white"/>
      <circle cx="21" cy="24.5" r="1.5" fill="white"/>
      <text x="42" y="25" fontFamily="'DM Sans',sans-serif" fontSize="20" fontWeight="800" fill="var(--text,#1a1a1a)" letterSpacing="-0.5">Shop</text>
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

export default function Footer() {
  const annee = new Date().getFullYear();
  return (
    <footer className="ft-root">
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

      <div className="ft-body">
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
              <span>Abidjan, Côte d'Ivoire</span>
            </span>
          </div>
          <PwaInstallButton />
        </div>

        <div className="ft-col">
          <h4 className="ft-heading">Navigation</h4>
          <a href="/"                 className="ft-link"><Home size={13}/><span>Accueil</span><ChevronRight size={11} className="ft-arr"/></a>
          <a href="/shop"              className="ft-link"><Info size={13}/><span>Boutique</span><ChevronRight size={11} className="ft-arr"/></a>
          <a href="/about"             className="ft-link"><Info size={13}/><span>À propos</span><ChevronRight size={11} className="ft-arr"/></a>
          <a href="/help"              className="ft-link"><HelpCircle size={13}/><span>Aide</span><ChevronRight size={11} className="ft-arr"/></a>
        </div>

        <div className="ft-col">
          <h4 className="ft-heading">Légal</h4>
          <a href="/cgu"                 className="ft-link"><ShieldCheck size={13}/><span>CGU</span><ChevronRight size={11} className="ft-arr"/></a>
          <a href="/cgu#confidentialite" className="ft-link"><ShieldCheck size={13}/><span>Confidentialité</span><ChevronRight size={11} className="ft-arr"/></a>
          <a href="/cgu#mentions"        className="ft-link"><Info size={13}/><span>Mentions</span><ChevronRight size={11} className="ft-arr"/></a>
        </div>
      </div>

      <div className="ft-bottom">
        <p>© {annee} <strong>ShopCI</strong> — Tous droits réservés</p>
      </div>

      <style>{`
        .ft-root {
          background: var(--bg2, #ffffff);
          color: var(--text, #1a1a1a);
          border-top: 1px solid var(--border, #e5e7eb);
          font-family: 'DM Sans', system-ui, sans-serif;
        }

        .ft-band {
          border-bottom: 1px solid var(--border, #e5e7eb);
          padding: 14px 0;
        }
        .ft-band-inner {
          max-width: 1280px; margin: 0 auto; padding: 0 20px;
          display: flex; align-items: center; justify-content: space-between; gap: 12px;
        }
        .ft-band-left { display: flex; align-items: center; gap: 12px; min-width: 0; }
        .ft-slogan { font-size: 11.5px; color: var(--text3, #9ca3af); white-space: nowrap; }
        .ft-socials { display: flex; gap: 7px; flex-shrink: 0; }
        .ft-social {
          width: 34px; height: 34px; border-radius: 10px;
          background: var(--bg3, #f3f4f6); border: 1px solid var(--border, #e5e7eb);
          display: flex; align-items: center; justify-content: center;
          color: var(--text2, #6b7280); text-decoration: none;
          transition: background .2s, border-color .2s, color .2s, transform .2s;
          flex-shrink: 0;
        }
        .ft-social:hover {
          background: var(--sc,#f97316); border-color: var(--sc,#f97316);
          color: #fff; transform: translateY(-2px);
        }

        .ft-body {
          max-width: 1280px; margin: 0 auto;
          padding: 28px 20px 16px;
          display: grid;
          grid-template-columns: 2fr 1fr 1fr;
          gap: 24px;
        }
        .ft-col { display: flex; flex-direction: column; gap: 5px; }
        .ft-col-brand { gap: 14px; }

        .ft-desc { font-size: 12.5px; color: var(--text2, #6b7280); line-height: 1.65; margin: 0; }

        .ft-contacts { display: flex; flex-direction: column; gap: 9px; }
        .ft-cline {
          display: flex; align-items: center; gap: 9px;
          font-size: 12px; color: var(--text2, #6b7280); text-decoration: none; transition: color .18s;
        }
        .ft-cline:hover { color: #f97316; }
        .ft-cico {
          width: 26px; height: 26px; background: rgba(249,115,22,0.12); border-radius: 7px;
          display: flex; align-items: center; justify-content: center;
          color: #f97316; flex-shrink: 0; transition: background .2s, color .2s;
        }
        .ft-cline:hover .ft-cico { background: #f97316; color: #fff; }

        .ft-heading {
          font-size: 9.5px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.2px;
          color: var(--text, #1a1a1a); padding-bottom: 8px;
          border-bottom: 2px solid #f97316; margin: 0 0 5px;
        }
        .ft-link {
          display: flex; align-items: center; gap: 7px;
          font-size: 12.5px; color: var(--text2, #6b7280); text-decoration: none;
          padding: 5px 0; transition: color .18s;
        }
        .ft-link span { flex: 1; }
        .ft-arr { color: var(--text3, #9ca3af); flex-shrink: 0; transition: color .18s, transform .18s; }
        .ft-link:hover { color: #f97316; }
        .ft-link:hover .ft-arr { color: #f97316; transform: translateX(2px); }

        .ft-bottom {
          border-top: 1px solid var(--border, #e5e7eb);
          padding: 14px 20px calc(14px + env(safe-area-inset-bottom, 0px));
          display: flex; align-items: center; justify-content: space-between;
          flex-wrap: wrap; gap: 10px;
        }
        .ft-bottom p { font-size: 11.5px; color: var(--text3, #9ca3af); margin: 0; }
        .ft-bottom p strong { color: #f97316; font-weight: 700; }

        @media (max-width: 900px) {
          .ft-body { grid-template-columns: 1fr 1fr; }
          .ft-col-brand { grid-column: 1 / -1; }
        }

        @media (max-width: 640px) {
          .ft-band-inner { padding: 0 16px; }
          .ft-slogan { display: none; }
          .ft-social { width: 38px; height: 38px; }

          .ft-body {
            grid-template-columns: 1fr;
            padding: 0;
            gap: 0;
          }
          .ft-col {
            padding: 16px;
            border-bottom: 1px solid var(--border, #e5e7eb);
            gap: 4px;
          }
          .ft-col:last-of-type { border-bottom: none; }
          .ft-col-brand { gap: 13px; padding: 18px 16px; }

          .ft-desc { font-size: 13px; }
          .ft-cline { font-size: 13.5px; gap: 10px; }
          .ft-cico  { width: 30px; height: 30px; border-radius: 8px; }
          .ft-heading { font-size: 10px; padding-bottom: 10px; margin-bottom: 7px; }
          .ft-link { font-size: 14px; padding: 9px 0; }

          .ft-bottom {
            flex-direction: column;
            align-items: center;
            text-align: center;
            padding: 16px 16px calc(16px + env(safe-area-inset-bottom, 0px));
            gap: 8px;
          }
          .ft-bottom p { font-size: 11px; }
        }

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
