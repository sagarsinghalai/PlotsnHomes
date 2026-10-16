/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack: (config, { dev }) => {
    if (dev) {
      config.cache = false;
    }
    return config;
  },
  // whatsapp-web.js + puppeteer are heavy native/CJS deps that must not be
  // bundled by webpack — keep them external so they load at runtime (Node only).
  experimental: {
    serverComponentsExternalPackages: ["whatsapp-web.js", "puppeteer", "puppeteer-core"],
  },
};

export default nextConfig;
