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
      '@x402/core': './lib/empty-module.js',
      '@x402/core/client': './lib/empty-module.js',
      '@x402/evm': './lib/empty-module.js',
      '@x402/evm/exact/client': './lib/empty-module.js',
      '@x402/evm/upto/client': './lib/empty-module.js',
      '@x402/svm': './lib/empty-module.js',
      '@x402/svm/exact/client': './lib/empty-module.js',
      '@x402/extensions': './lib/empty-module.js',
    },
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@x402/core': false,
      '@x402/core/client': false,
      '@x402/evm': false,
      '@x402/evm/exact/client': false,
      '@x402/evm/upto/client': false,
      '@x402/svm': false,
      '@x402/svm/exact/client': false,
      '@x402/extensions': false,
    };
    return config;
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
