/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['react-leaflet', '@react-leaflet', 'leaflet'],
  webpack: (config) => {
    config.resolve.fallback = {
      fs: false,
      path: false,
      os: false,
    };
    return config;
  }
};

export default nextConfig;
