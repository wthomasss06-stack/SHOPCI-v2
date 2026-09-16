'use client';

import { useEffect, useState } from 'react';
import { Download, Share } from 'lucide-react';

/**
 * Bouton d'installation PWA. Gère 3 cas :
 * - déjà installée (mode standalone) → rien n'est affiché
 * - Chrome/Android/desktop : capte `beforeinstallprompt`, déclenche le prompt natif
 * - iOS Safari : pas d'API d'installation programmatique → instructions manuelles
 */
export default function PwaInstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [installed, setInstalled] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [showIosHint, setShowIosHint] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia?.('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;
    setInstalled(standalone);
    setIsIos(/iPhone|iPad|iPod/.test(window.navigator.userAgent) && !window.MSStream);

    const onBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  if (installed) return null;
  if (!deferredPrompt && !isIos) return null; // rien à proposer sur ce navigateur

  const handleClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') setInstalled(true);
      setDeferredPrompt(null);
      return;
    }
    setShowIosHint((v) => !v);
  };

  return (
    <div className="pwa-install-wrap">
      <button type="button" onClick={handleClick} className="pwa-install-btn">
        <Download size={14} />
        <span>Installer l'app ShopCI</span>
      </button>

      {showIosHint && (
        <p className="pwa-ios-hint">
          Appuyez sur <Share size={12} style={{ verticalAlign: '-2px' }} /> Partager, puis
          « Sur l'écran d'accueil ».
        </p>
      )}

      <style>{`
        .pwa-install-wrap { display: flex; flex-direction: column; gap: 8px; }
        .pwa-install-btn {
          display: inline-flex; align-items: center; gap: 8px;
          font-family: 'DM Sans', system-ui, sans-serif;
          font-size: 12.5px; font-weight: 700;
          color: #fff; background: rgba(249,115,22,0.15);
          border: 1.5px solid rgba(249,115,22,0.4);
          border-radius: 10px; padding: 9px 14px;
          cursor: pointer; transition: background .18s, transform .18s;
          width: fit-content;
        }
        .pwa-install-btn:hover { background: #f97316; transform: translateY(-1px); }
        .pwa-ios-hint {
          font-size: 11.5px; color: rgba(255,255,255,0.55);
          margin: 0; line-height: 1.5; max-width: 220px;
        }
      `}</style>
    </div>
  );
}
