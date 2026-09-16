'use client';

import { useEffect } from 'react';

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // Installation impossible (navigateur non compatible, contexte non sécurisé…) :
        // le site continue de fonctionner normalement sans PWA installable.
      });
    }
  }, []);

  return null;
}
