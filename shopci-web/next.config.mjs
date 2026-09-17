/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      // Images uploadées via django-cloudinary-storage (production)
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      // Backend Django hébergé sur Render (dev / staging)
      {
        protocol: 'https',
        hostname: '*.onrender.com',
      },
      // Backend local (dev)
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8000',
      },
    ],
  },
};

export default nextConfig;
