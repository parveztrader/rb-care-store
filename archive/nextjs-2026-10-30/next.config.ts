import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || "",
  images: { remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com" }] },
  webpack(config, { dev }) {
    if (dev) config.devtool = "source-map";
    return config;
  },
};
export default nextConfig;
