import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Fix workspace root inference to avoid manifest issues
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
