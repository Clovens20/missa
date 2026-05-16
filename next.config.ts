import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200],
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
}

export default nextConfig
