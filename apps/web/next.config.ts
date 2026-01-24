import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // Required for Cloudflare Pages (no image optimization on edge)
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
