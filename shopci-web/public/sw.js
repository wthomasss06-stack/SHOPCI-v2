// Service worker minimal : sert uniquement à satisfaire les critères
// d'installabilité PWA de Chrome/Android. Pas de cache, pas de mode hors-ligne —
// volontairement, pour ne prendre aucun risque de contenu périmé sur un site
// marchand (prix, stock) tant qu'une vraie stratégie de cache n'a pas été
// décidée et testée.
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', () => {
  // Laisse passer toutes les requêtes au réseau normalement.
});
