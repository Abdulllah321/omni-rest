/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true
  },
  trailingSlash: true,
  basePath: process.env.NODE_ENV === 'production' ? '/omni-rest' : '',
  assetPrefix: process.env.NODE_ENV === 'production' ? '/omni-rest/' : '',
}

module.exports = nextConfig