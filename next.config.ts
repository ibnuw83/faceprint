
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  experimental: {
    // This allows the Next.js dev server to accept requests from the
    // Firebase Studio preview URL.
    allowedDevOrigins: [
      'https://*.cloudworkstations.dev',
      'https://*.firebase.studio',
    ],
  },
};

export default nextConfig;
