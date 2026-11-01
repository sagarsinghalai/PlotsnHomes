/** @type {import('next').NextConfig} */
import path from "node:path";

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
    config.resolve.alias["@"] = path.resolve("./src");
    if (dev) {
      config.cache = false;
    }
    return config;
  },
  // whatsapp-web.js + puppeteer are heavy native/CJS deps that must not be
  // bundled by webpack — keep them external so they load at runtime (Node only).
  experimental: {
    serverComponentsExternalPackages: ["whatsapp-web.js", "puppeteer", "puppeteer-core"],
    // Enables src/instrumentation.ts register() — runs the credential-encryption
    // readiness gate once at server startup. (Stable without this flag in Next 15.)
    instrumentationHook: true,
  },
};

export default nextConfig;
