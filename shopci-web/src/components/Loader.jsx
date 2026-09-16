// src/components/Loader.jsx
// Loader e-commerce moderne — thème ShopCI orange/noir

import React from 'react';

export default function Loader({ message = 'Chargement...' }) {
  return (
    <div className="shopci-loader-overlay" aria-live="polite" aria-busy="true">
      <div className="shopci-loader-bg" />

      <div className="shopci-loader-card">
        <div className="shopci-loader-logo-wrap">
          <svg viewBox="0 0 44 44" width="52" height="52" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <rect width="44" height="44" rx="12" fill="#f97316" />
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
          <div className="shopci-loader-ring" />
        </div>

        <div className="shopci-loader-brand" aria-label="ShopCI">
          <span className="shopci-loader-shop">Shop</span>
          <span className="shopci-loader-ci">CI</span>
        </div>

        <div className="shopci-loader-track">
          <div className="shopci-loader-bar" />
        </div>

        <div className="shopci-loader-dots">
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className="shopci-loader-dot" style={{ animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>

        <p className="shopci-loader-msg">{message}</p>
      </div>

      <style>{`
        @keyframes shopci-loader-progress {
          0%   { width: 0%; margin-left: 0; }
          50%  { width: 72%; margin-left: 0; }
          100% { width: 0%; margin-left: 100%; }
        }
        @keyframes shopci-loader-dot {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.3; }
          40%           { transform: scale(1.2); opacity: 1; }
        }
        @keyframes shopci-loader-ring {
          0%   { transform: scale(1); opacity: 0.7; }
          100% { transform: scale(1.8); opacity: 0; }
        }
        @keyframes shopci-loader-pop {
          0%   { transform: scale(0.8); opacity: 0; }
          60%  { transform: scale(1.05); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes shopci-loader-fade-up {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .shopci-loader-overlay {
          position: fixed;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          background: rgba(250, 250, 250, 0.92);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
        }

        .shopci-loader-bg {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(circle at 20% 50%, rgba(249,115,22,0.12), transparent 26%),
            radial-gradient(circle at 80% 30%, rgba(249,115,22,0.08), transparent 28%);
          pointer-events: none;
        }

        .shopci-loader-card {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          padding: 40px 48px;
          background: rgba(255,255,255,0.9);
          border: 1px solid rgba(229,231,235,0.9);
          border-radius: 24px;
          box-shadow: 0 12px 40px rgba(15, 23, 42, 0.08), 0 4px 16px rgba(249,115,22,0.08);
          min-width: 260px;
          animation: shopci-loader-fade-up 0.35s ease-out forwards;
        }

        .shopci-loader-logo-wrap {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 68px;
          height: 68px;
          animation: shopci-loader-pop 0.5s ease forwards;
        }

        .shopci-loader-ring {
          position: absolute;
          inset: -6px;
          border-radius: 50%;
          border: 3px solid rgba(249,115,22,0.8);
          animation: shopci-loader-ring 1.4s ease-out infinite;
        }

        .shopci-loader-brand {
          display: flex;
          align-items: baseline;
          gap: 1px;
          font-size: 28px;
          font-weight: 800;
          letter-spacing: -0.9px;
        }
        .shopci-loader-shop { color: #1a1a1a; }
        .shopci-loader-ci { color: #f97316; }

        .shopci-loader-track {
          width: 170px;
          height: 6px;
          background: #f3f4f6;
          border-radius: 999px;
          overflow: hidden;
          position: relative;
        }

        .shopci-loader-bar {
          height: 100%;
          width: 100%;
          border-radius: inherit;
          background: linear-gradient(90deg, #f97316 0%, #fb923c 50%, #f97316 100%);
          animation: shopci-loader-progress 1.6s ease-in-out infinite;
        }

        .shopci-loader-dots {
          display: flex;
          gap: 8px;
        }

        .shopci-loader-dot {
          width: 9px;
          height: 9px;
          border-radius: 50%;
          background: #f97316;
          animation: shopci-loader-dot 1.2s ease-in-out infinite;
        }

        .shopci-loader-msg {
          font-size: 13px;
          color: #6b7280;
          letter-spacing: 0.2px;
          margin: 0;
        }

        body.dark .shopci-loader-overlay {
          background: rgba(17,17,19,0.88);
        }

        body.dark .shopci-loader-card {
          background: rgba(28,28,30,0.9);
          border-color: rgba(58,58,60,0.9);
          box-shadow: 0 12px 40px rgba(0,0,0,0.42);
        }

        body.dark .shopci-loader-shop { color: #f5f5f7; }
        body.dark .shopci-loader-msg { color: #a1a1aa; }
      `}</style>
    </div>
  );
}