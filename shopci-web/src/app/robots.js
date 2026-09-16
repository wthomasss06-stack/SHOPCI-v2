export default function robots() {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
    },
    sitemap: 'https://shopci-v2.vercel.app/sitemap.xml',
    host: 'https://shopci-v2.vercel.app',
  };
}
