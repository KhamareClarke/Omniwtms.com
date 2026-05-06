/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Allow production build to complete even with ESLint errors (fix lint gradually)
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
};

module.exports = nextConfig;
