// next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  eslint: { ignoreDuringBuilds: true },     // don't fail Vercel builds on ESLint
  typescript: { ignoreBuildErrors: true },  // don't fail on TS type errors
};

export default nextConfig;
