// Fetch minimal, côté serveur, uniquement pour les métadonnées (SEO/Open Graph).
// Volontairement séparé de services/api.js : celui-ci est pensé pour le client
// (token JWT en localStorage, intercepteurs, redirection navigateur sur 401),
// rien de tout ça n'a de sens ni ne fonctionne pendant un rendu serveur.
// Erreur avalée intentionnellement : une métadonnée manquante ne doit jamais
// faire planter le rendu de la page produit.

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export async function getProductForMetadata(id) {
  try {
    const res = await fetch(`${API_BASE_URL}/products/${id}/`, {
      next: { revalidate: 3600 }, // ISR — régénéré au plus une fois par heure
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}
