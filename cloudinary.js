// lib/cloudinary.js
// Convertit un chemin local ('/images/xxx.ext') en URL Cloudinary — même
// arborescence, juste une autre origine + optimisation auto (format + qualité).
//
// Pourquoi : tout le dossier public/images (67 images, hero compris) est
// aujourd'hui committé dans le repo Git et servi par Vercel à chaque
// build/déploiement. Ça alourdit le repo et les déploiements. Cloudinary
// sert exactement les mêmes fichiers depuis un CDN, dans le format/poids
// le plus léger que le navigateur du visiteur accepte (AVIF/WebP) — même
// rendu, en plus léger et sans alourdir le repo.
//
// Usage : cld('/images/projects/akatech.webp') — le chemin d'entrée est
// identique à ce qui était utilisé en local, seule l'origine change.
// Ça suppose que les mêmes fichiers, avec les mêmes noms et la même
// arborescence, ont été uploadés sur Cloudinary sous BASE_FOLDER — sinon
// les URL générées ici pointent vers des fichiers qui n'existent pas.
//
// (Adapté du helper équivalent du projet Chez Florence — dossier et casse
// du chemin corrigés pour coller à la vraie arborescence AKATech, qui est
// en minuscules : public/images/, pas public/IMAGES/.)

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dwuybrjxh'

// Racine Cloudinary — à faire correspondre exactement au dossier utilisé
// lors de l'upload des images AKATech sur Cloudinary.
const BASE_FOLDER = 'akatech/images'

const VIDEO_EXTENSIONS = new Set(['webm', 'mp4', 'mov'])

/**
 * @param {string} localPath - chemin local tel qu'utilisé avant, ex: '/images/foo/bar.webp'
 * @param {{ width?: number }} [options] - largeur optionnelle (sinon Cloudinary sert l'original, juste optimisé format/qualité)
 * @returns {string} URL Cloudinary prête à mettre dans un src/poster/background-image
 */
export function cld(localPath, options = {}) {
  const clean = localPath.replace(/^\/?images\//i, '')
  const dotIndex = clean.lastIndexOf('.')
  const base = dotIndex !== -1 ? clean.slice(0, dotIndex) : clean
  const ext = dotIndex !== -1 ? clean.slice(dotIndex + 1).toLowerCase() : 'jpg'
  const resourceType = VIDEO_EXTENSIONS.has(ext) ? 'video' : 'image'

  const transforms = ['f_auto', 'q_auto']
  if (options.width) transforms.push(`w_${options.width}`)

  return `https://res.cloudinary.com/${CLOUD_NAME}/${resourceType}/upload/${transforms.join(',')}/${BASE_FOLDER}/${base}.${ext}`
}
