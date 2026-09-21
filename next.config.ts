import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.cdn.printful.com",
      },
      {
        protocol: "https",
        hostname: "files.printful.com",
      },
    ],
  },
};

export default nextConfig;
