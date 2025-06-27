/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
    },
  reactStrictMode: true,
    swcMinify: true,
  async rewrites() {
      return [
          {
              source: '/api/:path*',
              destination: 'http://localhost:5245/api/:path*'
          }
      ]
  },
}
export default nextConfig
