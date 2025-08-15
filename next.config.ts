import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    // Avoid ESLint serialization issues during Vercel builds
    ignoreDuringBuilds: true,
  },
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"],
    });
    return config;
  },
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client']
  },
  output: 'standalone'
};

export default nextConfig;
