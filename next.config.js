/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
      return [
          {
              source: '/',
              destination: '/admin',
              basePath: false,
              permanent: false
          }
      ]
  },
  reactStrictMode: true,
  images: {
    domains: ['lh3.googleusercontent.com'],
  },
  // Disable trace generation to prevent EPERM errors
  generateBuildId: async () => {
    return 'build-id'
  },
}

module.exports = nextConfig
