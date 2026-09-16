import HomeContent from '../HomeContent';

export const metadata = {
  metadataBase: new URL('https://shopci-v2.vercel.app'),
  title: 'Catalogue ShopCI | Produits en ligne',
  description: 'Parcourez le catalogue ShopCI : smartphones, électroménager, mode, maison et bien plus encore.',
  alternates: { canonical: '/shop' },
};

export default function ShopPage() {
  return <HomeContent />;
}
