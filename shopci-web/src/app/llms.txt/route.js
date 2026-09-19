export async function GET() {
  const content = `# ShopCI

> ShopCI est une marketplace ivoirienne qui met en relation des vendeurs indépendants et des acheteurs à travers toute la Côte d'Ivoire, avec livraison suivie et paiement à la réception.

ShopCI fonctionne comme une place de marché à la Amazon, adaptée au contexte ivoirien : n'importe quel vendeur peut ouvrir une boutique et y publier ses produits (mode, électronique, maison, beauté, sport, accessoires...), et n'importe quel acheteur peut parcourir le catalogue, commander et suivre sa livraison en temps réel jusqu'à confirmation de réception. Le règlement se fait actuellement en espèces à la livraison ; les paiements mobiles (Orange Money, MTN Money, Wave, Moov Money) sont en cours d'intégration. La connexion se fait exclusivement via un compte Google. Le site a été créé par AKATech Studio (https://akatech.vercel.app).

## Paiement
- Paiement à la livraison, en espèces, uniquement pour le moment
- Aucune donnée bancaire n'est collectée par ShopCI
- Mobile money (Orange Money, MTN Money, Wave, Moov Money) : à venir

## Livraison
- Livraison partout en Côte d'Ivoire, assurée par le vendeur ou son livreur
- Suivi de commande géolocalisé, avec preuve photo du colis
- La commande n'est marquée livrée qu'après confirmation de réception par l'acheteur

## Pages
- [Accueil / Boutique](https://shopci-v2.vercel.app/): catalogue complet des produits, filtrable par catégorie et par prix
- [Fiche produit](https://shopci-v2.vercel.app/product/{id}): détail d'un produit, prix, vendeur, avis
- [Aide](https://shopci-v2.vercel.app/aide): questions fréquentes sur la commande, la livraison et le paiement
- [CGU, CGV, confidentialité, mentions légales](https://shopci-v2.vercel.app/cgu): conditions d'utilisation et de vente, politique de confidentialité, mentions légales
- [Connexion / Inscription](https://shopci-v2.vercel.app/login): accès au compte via Google

## Optional
- Pages panier, commande, tableau de bord acheteur et vendeur : accessibles uniquement aux utilisateurs connectés, non indexables
`;

  return new Response(content, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
