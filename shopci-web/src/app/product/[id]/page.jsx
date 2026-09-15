import ProductDetailContent from './ProductDetailContent';
import { getProductForMetadata } from '@/lib/server-fetch';

// C'est ici que se joue le point mort repéré dans l'audit : sans ça, un lien
// produit partagé sur WhatsApp n'affichait ni titre ni image ni prix.
export async function generateMetadata({ params }) {
  const { id } = await params;
  const product = await getProductForMetadata(id);

  if (!product) {
    return { title: 'Produit — ShopCI' };
  }

  const title = `${product.name} — ShopCI`;
  const description = (product.description || '').slice(0, 155);
  const image = product.image || product.images?.[0]?.image || undefined;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: image ? [{ url: image }] : undefined,
      type: 'website',
    },
    twitter: {
      card: image ? 'summary_large_image' : 'summary',
      title,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default function ProductPage() {
  return <ProductDetailContent />;
}
