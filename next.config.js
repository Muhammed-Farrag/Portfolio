/** @type {import('next').NextConfig} */
const nextConfig = {
    // Enable React Three Fiber compatibility
    transpilePackages: ['three'],

    // Empty turbopack config to allow Turbopack (Next.js 16 default)
    turbopack: {},
};

module.exports = nextConfig;
