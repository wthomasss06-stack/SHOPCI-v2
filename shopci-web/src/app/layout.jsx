import { DM_Sans } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister';
import Providers from '@/components/Providers';
import SessionSync from '@/components/SessionSync';
import './globals.css';

// Remplace le <link> Google Fonts de l'ancien index.html : next/font
// auto-héberge la police (plus rapide, pas de requête bloquante externe)
// tout en gardant le nom "DM Sans" utilisé partout dans les styles inline.
const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  display: 'swap',
});

export const metadata = {
  title: "ShopCI — Marketplace Côte d'Ivoire",
  description: "ShopCI — La marketplace N°1 de Côte d'Ivoire. Achetez et vendez facilement.",
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.svg',
    apple: '/icons/apple-touch-icon.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'ShopCI',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#f97316',
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr" data-scroll-behavior="smooth">
      <body className={dmSans.className}>
        <Providers>
          <SessionSync />
          <ServiceWorkerRegister />
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                borderRadius: '12px',
                background: '#1a1a1a',
                color: '#fff',
                fontSize: '14px',
                fontWeight: '500',
              },
              success: { iconTheme: { primary: '#f97316', secondary: '#fff' } },
              error:   { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
            }}
          />
          {children}
        </Providers>
      </body>
    </html>
  );
}
