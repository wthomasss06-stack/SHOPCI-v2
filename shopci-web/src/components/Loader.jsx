// src/components/Loader.jsx
// Loader e-commerce moderne — thème ShopCI orange/noir

import React from 'react';

export default function Loader({ message = 'Chargement...' }) {
  return (
    <div className="shopci-loader-overlay">
      {/* Fond avec grain subtil */}
      <div style={styles.bg} />

      <div className="shopci-loader-card">
        {/* Logo animé */}
        <div style={styles.logoWrap}>
          <svg viewBox="0 0 44 44" width="52" height="52" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="44" height="44" rx="12" fill="#f97316" style={styles.logoBg} />
            <path
              d="M10 16h4l4.5 13h11l3.5-10H14"
              stroke="white"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="19.5" cy="32" r="2" fill="white" />
            <circle cx="27.5" cy="32" r="2" fill="white" />
          </svg>
          <div style={styles.ring} />
        </div>

        {/* Nom du site */}
        <div style={styles.siteName}>
          <span className="shopci-loader-shop">Shop</span>
          <span style={styles.siteCI}>CI</span>
        </div>

        {/* Barre de progression animée */}
        <div style={styles.progressTrack}>
          <div style={styles.progressBar} />
        </div>

        {/* Points clignotants */}
        <div style={styles.dotsRow}>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} style={{ ...styles.dot, animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>

        <p className="shopci-loader-msg">{message}</p>
      </div>

      <style>{`
        @keyframes shopci-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes shopci-progress {
          0%   { width: 0%; margin-left: 0; }
          50%  { width: 70%; margin-left: 0; }
          100% { width: 0%; margin-left: 100%; }
        }
        @keyframes shopci-dot {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.3; }
          40%           { transform: scale(1.2); opacity: 1; }
        }
        @keyframes shopci-ring {
          0%   { transform: scale(1);   opacity: 0.6; }
          100% { transform: scale(1.8); opacity: 0; }
        }
        @keyframes shopci-logo-pop {
          0%   { transform: scale(0.8); opacity: 0; }
          60%  { transform: scale(1.05); }
          100% { transform: scale(1);   opacity: 1; }
        }
        @keyframes shopci-fade-up {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* Overlay */
        .shopci-loader-overlay {
          position: fixed;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          background: var(--bg, #fafafa);
          transition: background .3s;
        }

        /* Card */
        .shopci-loader-card {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          padding: 40px 48px;
          background: var(--bg2, #ffffff);
          border-radius: 24px;
          box-shadow: 0 4px 6px rgba(0,0,0,0.04), 0 20px 60px rgba(0,0,0,0.08);
          border: 1px solid var(--border, #f3f4f6);
          min-width: 260px;
          animation: shopci-fade-up 0.4s ease forwards;
          transition: background .3s, border-color .3s;
        }

        .shopci-loader-shop { color: var(--text, #1a1a1a); }
        .shopci-loader-msg  { font-size: 13px; color: var(--text2, #9ca3af); letter-spacing: 0.3px; }

        /* Dark mode card */
        body.dark .shopci-loader-overlay { background: #111113; }
        body.dark .shopci-loader-card {
          background: #1c1c1e;
          border-color: #3a3a3c;
          box-shadow: 0 4px 6px rgba(0,0,0,0.2), 0 20px 60px rgba(0,0,0,0.4);
        }
        body.dark .shopci-loader-shop { color: #f5f5f7; }
        body.dark .shopci-loader-msg  { color: #636366; }
      `}</style>
    </div>
  );
}

/* ── Styles inline ── */
const styles = {
  bg: {
    position: 'absolute',
    inset: 0,
    background:
      'radial-gradient(ellipse at 20% 50%, rgba(249,115,22,0.08) 0%, transparent 60%),' +
      'radial-gradient(ellipse at 80% 20%, rgba(249,115,22,0.05) 0%, transparent 50%)',
    pointerEvents: 'none',
  },
  logoWrap: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '68px',
    height: '68px',
    animation: 'shopci-logo-pop 0.5s ease forwards',
  },
  logoBg: {
    filter: 'drop-shadow(0 4px 12px rgba(249,115,22,0.4))',
  },
  ring: {
    position: 'absolute',
    inset: '-6px',
    borderRadius: '50%',
    border: '3px solid #f97316',
    animation: 'shopci-ring 1.4s ease-out infinite',
  },
  siteName: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '1px',
    fontSize: '26px',
    fontWeight: '800',
    letterSpacing: '-0.8px',
  },
  siteCI: {
    color: '#f97316',
  },
  progressTrack: {
    width: '160px',
    height: '4px',
    background: '#f3f4f6',
    borderRadius: '4px',
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    background: 'linear-gradient(90deg, #f97316, #fb923c, #f97316)',
    borderRadius: '4px',
    animation: 'shopci-progress 1.6s ease-in-out infinite',
  },
  dotsRow: {
    display: 'flex',
    gap: '8px',
  },
  dot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    background: '#f97316',
    animation: 'shopci-dot 1.2s ease-in-out infinite',
  },
};