'use client';

// src/pages/NotFoundPage.jsx
// ShopCI — Page 404 personnalisée

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Home, ShoppingBag, ArrowLeft, Search, RefreshCw } from 'lucide-react';

export default function NotFoundPage() {
  const router = useRouter();
  const [recherche, setRecherche] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    if (recherche.trim()) router.push(`/?q=${encodeURIComponent(recherche.trim())}`);
  };

  return (
    <div className="nf-root">
      {/* Logo cliquable */}
      <button className="nf-logo" onClick={() => router.push('/')}>
        <svg viewBox="0 0 140 34" height={32} fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="34" height="34" rx="8" fill="#f97316"/>
          <path d="M7 11h3l3.5 10h8.5l3-8H11" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <circle cx="14.5" cy="24.5" r="1.5" fill="white"/>
          <circle cx="21" cy="24.5" r="1.5" fill="white"/>
          <text x="42" y="25" fontFamily="'DM Sans',sans-serif" fontSize="20" fontWeight="800" fill="#f5f5f7" letterSpacing="-0.5">Shop</text>
          <text x="91" y="25" fontFamily="'DM Sans',sans-serif" fontSize="20" fontWeight="800" fill="#f97316" letterSpacing="-0.5">CI</text>
        </svg>
      </button>

      {/* Contenu central */}
      <div className="nf-center">

        {/* Gros 404 stylisé */}
        <div className="nf-404-wrap">
          <div className="nf-404-bg">404</div>
          <div className="nf-404-fg">
            {/* Icône panier cassé */}
            <div className="nf-icone-wrap">
              <div className="nf-icone-ring" />
              <div className="nf-icone-ring nf-icone-ring-2" />
              <svg viewBox="0 0 64 64" width="72" height="72" fill="none">
                <rect width="64" height="64" rx="16" fill="#f97316" style={{ filter:'drop-shadow(0 6px 20px rgba(249,115,22,0.5))' }}/>
                <path d="M14 22h6l7 20h16l6-16H22" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="29" cy="46" r="3" fill="white"/>
                <circle cx="41" cy="46" r="3" fill="white"/>
                {/* Croix "cassé" */}
                <line x1="44" y1="14" x2="52" y2="22" stroke="white" strokeWidth="3" strokeLinecap="round"/>
                <line x1="52" y1="14" x2="44" y2="22" stroke="white" strokeWidth="3" strokeLinecap="round"/>
              </svg>
            </div>
          </div>
        </div>

        <h1 className="nf-titre">Page introuvable</h1>
        <p className="nf-sous">
          Oops ! Cette page n'existe pas ou a été déplacée.<br/>
          Pas de panique, on vous ramène à la boutique.
        </p>

        {/* Barre de recherche */}
        <form className="nf-search" onSubmit={handleSearch}>
          <Search size={16} className="nf-search-ico"/>
          <input
            type="text"
            placeholder="Rechercher un produit…"
            value={recherche}
            onChange={e => setRecherche(e.target.value)}
            className="nf-search-input"
          />
          <button type="submit" className="nf-search-btn">Chercher</button>
        </form>

        {/* Boutons d'action */}
        <div className="nf-actions">
          <button className="nf-btn-principal" onClick={() => router.push('/')}>
            <Home size={17}/> Retour à l'accueil
          </button>
          <button className="nf-btn-secondaire" onClick={() => router.back()}>
            <ArrowLeft size={17}/> Page précédente
          </button>
          <button className="nf-btn-ghost" onClick={() => router.push('/shop')}>
            <ShoppingBag size={17}/> Voir la boutique
          </button>
        </div>

        {/* Raccourcis rapides */}
        <div className="nf-raccourcis">
          <span className="nf-raccourcis-label">Liens populaires :</span>
          {[
            { label: 'Accueil',    path: '/' },
            { label: 'Boutique',   path: '/shop' },
            { label: 'Connexion',  path: '/login' },
            { label: 'Inscription',path: '/register' },
            { label: 'Panier',     path: '/cart' },
          ].map(({ label, path }) => (
            <button key={path} className="nf-raccourci-pill" onClick={() => router.push(path)}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Footer minimal */}
      <div className="nf-footer">
        <span>© {new Date().getFullYear()} ShopCI · La marketplace N°1 de Côte d'Ivoire</span>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');

        .nf-root {
          font-family: 'DM Sans', system-ui, sans-serif;
          min-height: 100vh;
          background: #111113;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
          padding: 20px;
        }

        /* Dégradés décoratifs */
        .nf-root::before {
          content: '';
          position: absolute;
          top: -120px; right: -120px;
          width: 500px; height: 500px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(249,115,22,0.18) 0%, transparent 65%);
          pointer-events: none;
        }
        .nf-root::after {
          content: '';
          position: absolute;
          bottom: -100px; left: -100px;
          width: 400px; height: 400px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(249,115,22,0.10) 0%, transparent 65%);
          pointer-events: none;
        }

        /* Logo */
        .nf-logo {
          position: absolute;
          top: 24px; left: 28px;
          background: none; border: none; cursor: pointer;
          z-index: 10;
          opacity: 0.9;
          transition: opacity .2s;
        }
        .nf-logo:hover { opacity: 1; }

        /* Centre */
        .nf-center {
          position: relative;
          z-index: 5;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 24px;
          text-align: center;
          max-width: 560px;
          width: 100%;
          animation: nfFadeUp .6s cubic-bezier(.22,1,.36,1) both;
        }
        @keyframes nfFadeUp {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* 404 wrap */
        .nf-404-wrap {
          position: relative;
          height: 140px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .nf-404-bg {
          font-size: clamp(100px, 18vw, 160px);
          font-weight: 900;
          color: rgba(249,115,22,0.08);
          letter-spacing: -6px;
          line-height: 1;
          user-select: none;
          position: absolute;
          white-space: nowrap;
        }
        .nf-404-fg {
          position: relative;
          z-index: 2;
        }

        /* Icône */
        .nf-icone-wrap {
          position: relative;
          width: 100px; height: 100px;
          display: flex; align-items: center; justify-content: center;
        }
        .nf-icone-ring {
          position: absolute;
          inset: -8px;
          border-radius: 50%;
          border: 2px solid rgba(249,115,22,0.25);
          animation: nfRing 2s ease-in-out infinite;
        }
        .nf-icone-ring-2 {
          inset: -20px;
          border-color: rgba(249,115,22,0.12);
          animation-delay: .5s;
          animation-duration: 2.5s;
        }
        @keyframes nfRing {
          0%,100% { transform: scale(1); opacity: .6; }
          50%      { transform: scale(1.08); opacity: 1; }
        }

        /* Titre */
        .nf-titre {
          font-size: clamp(26px, 5vw, 38px);
          font-weight: 800;
          color: #f5f5f7;
          margin: 0;
          letter-spacing: -1px;
          line-height: 1.15;
        }
        .nf-sous {
          font-size: 15px;
          color: rgba(255,255,255,0.5);
          line-height: 1.65;
          margin: 0;
        }

        /* Barre de recherche */
        .nf-search {
          display: flex;
          align-items: center;
          background: rgba(255,255,255,0.06);
          border: 1.5px solid rgba(255,255,255,0.12);
          border-radius: 14px;
          padding: 4px 4px 4px 16px;
          gap: 10px;
          width: 100%;
          max-width: 420px;
          transition: border-color .2s;
        }
        .nf-search:focus-within { border-color: #f97316; }
        .nf-search-ico { color: rgba(255,255,255,0.3); flex-shrink: 0; }
        .nf-search-input {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          font-size: 14px;
          color: #f5f5f7;
          height: 40px;
          font-family: 'DM Sans', sans-serif;
        }
        .nf-search-input::placeholder { color: rgba(255,255,255,0.28); }
        .nf-search-btn {
          background: #f97316;
          color: #fff;
          border: none;
          border-radius: 10px;
          padding: 8px 18px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          white-space: nowrap;
          font-family: 'DM Sans', sans-serif;
          transition: background .18s;
        }
        .nf-search-btn:hover { background: #ea6a0a; }

        /* Boutons d'action */
        .nf-actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          justify-content: center;
        }
        .nf-btn-principal {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #f97316;
          color: #fff;
          border: none;
          border-radius: 12px;
          padding: 12px 22px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          box-shadow: 0 4px 16px rgba(249,115,22,0.4);
          transition: background .18s, transform .15s;
        }
        .nf-btn-principal:hover { background: #ea6a0a; transform: translateY(-1px); }
        .nf-btn-secondaire {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(255,255,255,0.07);
          color: #f5f5f7;
          border: 1.5px solid rgba(255,255,255,0.15);
          border-radius: 12px;
          padding: 12px 22px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          transition: background .18s, border-color .18s;
        }
        .nf-btn-secondaire:hover { background: rgba(255,255,255,0.13); border-color: rgba(255,255,255,0.3); }
        .nf-btn-ghost {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: none;
          color: rgba(255,255,255,0.5);
          border: 1.5px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          padding: 12px 22px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          transition: color .18s, border-color .18s;
        }
        .nf-btn-ghost:hover { color: #f97316; border-color: rgba(249,115,22,0.4); }

        /* Raccourcis */
        .nf-raccourcis {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
          justify-content: center;
        }
        .nf-raccourcis-label {
          font-size: 12px;
          color: rgba(255,255,255,0.3);
          white-space: nowrap;
        }
        .nf-raccourci-pill {
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 999px;
          padding: 5px 14px;
          font-size: 12.5px;
          font-weight: 600;
          color: rgba(255,255,255,0.6);
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          transition: all .18s;
        }
        .nf-raccourci-pill:hover {
          background: rgba(249,115,22,0.15);
          border-color: rgba(249,115,22,0.35);
          color: #f97316;
        }

        /* Footer */
        .nf-footer {
          position: absolute;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          font-size: 12px;
          color: rgba(255,255,255,0.2);
          white-space: nowrap;
          z-index: 5;
        }

        @media (max-width: 480px) {
          .nf-actions { gap: 8px; }
          .nf-btn-principal, .nf-btn-secondaire, .nf-btn-ghost { padding: 11px 16px; font-size: 13px; }
          .nf-404-wrap { height: 110px; }
        }
      `}</style>
    </div>
  );
}