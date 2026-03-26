const withNextra = require('nextra')({
  theme: 'nextra-theme-docs',
  themeConfig: './theme.config.jsx',
})

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

module.exports = withNextra(nextConfig)