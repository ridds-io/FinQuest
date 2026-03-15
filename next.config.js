/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    turbopack: false,
  },
  images: {
    remotePatterns: [{ protocol: 'https', hostname: '*.supabase.co', pathname: '/**' }],
    unoptimized: true,
  },
  webpack: (config, { isServer }) => {
    if (isServer) config.resolve.alias = { ...config.resolve.alias, phaser: false };
    return config;
  },
};

module.exports = nextConfig;