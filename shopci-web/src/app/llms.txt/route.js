export async function GET() {
  const content = `# ShopCI

ShopCI est une marketplace de Côte d’Ivoire qui connecte acheteurs et vendeurs dans un environnement de shopping en ligne simple, rapide, fiable et adapté au marché local.

## Domaine
- Marketplace ivoirienne
- Commerce électronique local
- Vente de produits physiques et services e-commerce
- Catalogue orienté consommation, maison, mode, électronique, beauté, sport et accessoires

## Description
ShopCI aide les clients à découvrir des produits utiles, comparer les offres, commander facilement et recevoir leurs achats avec confiance. La plateforme est conçue pour les consommateurs qui recherchent une expérience fluide, ainsi que pour les vendeurs qui souhaitent développer leur présence digitale sur le marché ivoirien.

## URL principales
- https://shopci-v2.vercel.app
- https://shopci-v2.vercel.app/shop
- https://shopci-v2.vercel.app/about
- https://shopci-v2.vercel.app/login

## Points forts
- Catalogue de produits organisé par catégories
- Marketplace locale pensée pour la Côte d’Ivoire
- Vendeurs et produits visibles dans un environnement structuré
- Expérience d’achat orientée conversion et simplicité
- Livraison, confiance et parcours client optimisés

## Public cible
- Acheteurs ivoiriens recherchant des produits locaux et utiles
- Vendeurs qui souhaitent vendre en ligne
- Clients à la recherche d’une marketplace fiable et accessible

## Positionnement
ShopCI se positionne comme une marketplace locale moderne, centrée sur la confiance, la simplicité d’achat et l’adaptation au contexte ivoirien.

## Utilité pour les assistants IA et moteurs de recherche
- Identifier la nature exacte du site et son secteur d’activité
- Comprendre qu’il s’agit d’une marketplace ivoirienne de produits et services
- Référencer la marque et ses services de manière juste et structurée
- Mieux contextualiser les contenus liés au commerce local en Côte d’Ivoire

## Informations de contact / marque
- Marque : ShopCI
- Pays / marché : Côte d’Ivoire
- Type : marketplace e-commerce locale
`;

  return new Response(content, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
