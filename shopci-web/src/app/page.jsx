import HomeContent from './HomeContent';

export const metadata = {
  title: "ShopCI — Marketplace N°1 de Côte d'Ivoire",
  description: "Achetez et vendez facilement sur ShopCI, la marketplace ivoirienne. Livraison suivie, paiement à la livraison.",
  openGraph: {
    title: "ShopCI — Marketplace N°1 de Côte d'Ivoire",
    description: "Achetez et vendez facilement sur ShopCI, la marketplace ivoirienne.",
    type: 'website',
  },
};

export default function Page() {
  return <HomeContent />;
}
