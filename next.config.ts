import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "@react-pdf/renderer",
    "whatsapp-web.js",
    "puppeteer",
    "puppeteer-core",
  ],
  turbopack: {},
};

export default nextConfig;
