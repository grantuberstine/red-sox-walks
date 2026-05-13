import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {},
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "midfield.mlbstatic.com",
        pathname: "/v1/people/**",
      },
      {
        protocol: "https",
        hostname: "www.mlbstatic.com",
        pathname: "/team-logos/**",
      },
    ],
  },
};

export default nextConfig;
