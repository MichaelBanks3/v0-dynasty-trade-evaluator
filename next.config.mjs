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
  async redirects() {
    return [
      {
        source: '/create-trade',
        destination: '/trade',
        permanent: true,
      },
      {
        source: '/trade/create',
        destination: '/trade',
        permanent: true,
      },
      {
        source: '/new-trade',
        destination: '/trade',
        permanent: true,
      },
      {
        source: '/trade/new',
        destination: '/trade',
        permanent: true,
      },
    ]
  },
}

export default nextConfig