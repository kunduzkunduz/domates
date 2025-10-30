/** @type {import('next').NextConfig} */
const nextConfig = {
  // Development mode - no static export
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
}

module.exports = nextConfig