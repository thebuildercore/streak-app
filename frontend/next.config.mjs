/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  webpack: (config) => {
    config.externals.push(
      '@x402/core',
      '@x402/core/client',
      '@x402/evm',
      '@x402/evm/exact/client',
      '@x402/evm/upto/client',
      '@x402/svm',
      '@x402/svm/exact/client',
      '@react-native-async-storage/async-storage',
    )
    return config
  },
}

export default nextConfig
