/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      'wagmi',
      'viem',
      'viem/chains',
      'viem/accounts',
      '@rainbow-me/rainbowkit',
      '@somnia-chain/markets-sdk',
      '@somnia-chain/markets-sdk/react',
      '@base-ui/react',
      '@tanstack/react-query',
    ],
  },
  // Turbopack config (Next.js 16 default bundler)
  turbopack: {
    resolveAlias: {
      // Stub out react-native packages that WalletConnect drags in transitively
      '@react-native-async-storage/async-storage': { browser: './lib/empty-module.js' },
    },
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://127.0.0.1:4000/api/:path*',
      },
    ]
  },
}

export default nextConfig
