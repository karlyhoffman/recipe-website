import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  serverExternalPackages: ['pdf-parse', 'pdfjs-dist'],
};

export default nextConfig;
