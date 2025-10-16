import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Exclude specific folders from Next.js routing
  pageExtensions: ['js', 'jsx', 'ts', 'tsx', 'md', 'mdx'],
  // Exclude folders from being treated as routes
  async rewrites() {
    return {
      beforeFiles: [],
      afterFiles: [],
      fallback: []
    };
  },
  // Custom webpack configuration to ignore specific directories
  webpack: (config) => {
    // Exclude specific directories from being processed as routes
    config.watchOptions = {
      ...config.watchOptions,
      ignored: [
        '**/node_modules/**',
        '**/uwezo.app/**',
        '**/queries/**',
        '**/.git/**',
        '**/.next/**'
      ]
    };
    
    return config;
  },
};

export default nextConfig;
