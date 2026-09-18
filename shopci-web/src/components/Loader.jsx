// src/components/Loader.jsx
// Loader plein écran, minimal — inspiré du loader Kôkô Eats : pas de carte ni
// de flou, juste le fond du thème, la marque, une icône qui tourne.

import React from 'react';

export default function Loader({ message = 'Chargement…' }) {
  return (
    <div className="shopci-loader" role="status" aria-live="polite" aria-busy="true">
      <div className="shopci-loader__mark">
        <svg viewBox="0 0 44 44" width="1em" height="1em" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <circle cx="22" cy="22" r="20" stroke="#f97316" strokeWidth="2.4" strokeOpacity="0.18" />
          <path d="M22 2a20 20 0 0 1 20 20" stroke="#f97316" strokeWidth="2.4" strokeLinecap="round" />
        </svg>
      </div>
      <div className="shopci-loader__brand" aria-label="ShopCI">
        <span>Shop</span><strong>CI</strong>
      </div>
      <p>{message}</p>

      <style>{`
        .shopci-loader {
          position: fixed; inset: 0; z-index: 9999;
          display: grid; justify-items: center; align-content: center; gap: 18px;
          background: var(--bg); color: var(--text);
        }
        .shopci-loader__mark {
          font-size: 40px; line-height: 0;
          animation: shopci-loader-spin 0.9s linear infinite;
        }
        .shopci-loader__brand {
          display: inline-flex; align-items: baseline; gap: 1px;
          font-family: 'DM Sans', system-ui, sans-serif;
          font-size: clamp(28px, 7vw, 40px); font-weight: 800; letter-spacing: -1px;
        }
        .shopci-loader__brand span { color: var(--text); }
        .shopci-loader__brand strong { color: #f97316; }
        .shopci-loader p {
          margin: 0; font-size: 11.5px; font-weight: 700; letter-spacing: 0.16em;
          text-transform: uppercase; color: var(--text2, #9ca3af);
        }
        @keyframes shopci-loader-spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
