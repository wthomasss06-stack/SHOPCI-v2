// shopci-web/src/lib/getImageUrl.js
// Normalise toute valeur image retournée par l'API Django en URL affichable.
//
// En production, django-cloudinary-storage retourne déjà des URL absolues
// Cloudinary (https://res.cloudinary.com/...). Cette fonction les passe telles
// quelles. Elle gère aussi les chemins relatifs backend (/media/...) pour le
// développement local.
//
// ⚠️  Aucun secret (API_KEY, API_SECRET) ne doit apparaître ici.
//     Seul NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME (valeur publique) est utilisé
//     pour construire des URL d'assets statiques du frontend.

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
const BACKEND_BASE = API_URL.replace(/\/api\/?$/, '');

/**
 * Construit une URL CDN Cloudinary pour un chemin d'asset statique frontend.
 * Utilise uniquement le cloud name (variable publique NEXT_PUBLIC_).
 * Pas de SDK requis, pas de secret.
 *
 * @param {string} path  - ex: '/images/banner.webp' ou 'products/hero.jpg'
 * @returns {string | null}
 */
function buildCloudinaryUrl(path) {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  if (!cloudName) return null;

  const clean = path.replace(/^\/+/, '').replace(/\\/g, '/');
  // Retire les préfixes images/ ou public/images/ pour obtenir le public_id
  const publicId = clean.replace(/^(public\/)?images\//i, '');
  return `https://res.cloudinary.com/${cloudName}/image/upload/f_auto,q_auto/${publicId}`;
}

/**
 * Normalise et résout l'URL d'une image pour l'affichage (Frontend).
 * Gère les URL Cloudinary absolues, les chemins locaux /images/... et les
 * chemins relatifs backend /media/... (dev local uniquement).
 *
 * @param {string | object} pathOrUrl
 * @returns {string | null}
 */
export function getImageUrl(pathOrUrl) {
  if (!pathOrUrl) return null;

  // Si c'est un objet (ex: File, ou { url: '...' })
  if (typeof pathOrUrl === 'object' && pathOrUrl?.url) {
    return getImageUrl(pathOrUrl.url);
  }

  const clean = String(pathOrUrl).trim();
  if (!clean) return null;

  // 1. URL absolue (http://... ou https://..., inclut res.cloudinary.com)
  //    django-cloudinary-storage retourne déjà ce format en production.
  if (clean.startsWith('http://') || clean.startsWith('https://')) {
    return clean;
  }

  // 2. Chemin frontend local (/images/... ou images/...)
  //    → on tente de construire une URL Cloudinary (assets statiques uploadés manuellement)
  if (clean.startsWith('/images/') || clean.startsWith('images/')) {
    const cdnUrl = buildCloudinaryUrl(clean);
    if (cdnUrl) return cdnUrl;
    // fallback : chemin relatif local (dev sans NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME)
    return clean.startsWith('/') ? clean : `/${clean}`;
  }

  // 3. Chemin relatif backend (/media/..., products/..., etc.) — dev local uniquement.
  //    En production, ce cas ne devrait pas arriver : Django retourne des URL absolues.
  const relative = clean.startsWith('/') ? clean : `/${clean}`;
  return `${BACKEND_BASE}${relative}`;
}

export default getImageUrl;
