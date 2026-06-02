import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  serverExternalPackages: ['pdf-parse', 'pdfjs-dist'],
  outputFileTracingIncludes: {
    '/api/import/extract': [
      './node_modules/.pnpm/pdfjs-dist*/node_modules/pdfjs-dist/legacy/build/**/*',
    ],
  },
};

export default nextConfig;
