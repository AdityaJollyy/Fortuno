/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ["192.168.29.238"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "randomuser.me",
        pathname: "/api/portraits/**",
      },
      {
        protocol: "https",
        hostname: "img.clerk.com",
      },
    ],
  },
  serverExternalPackages: ["@prisma/client", "pg"],
  experimental: {
    // Default is 1MB, which a phone photo exceeds immediately.
    serverActions: {
      bodySizeLimit: "5mb",
    },
  },
};

export default nextConfig;
