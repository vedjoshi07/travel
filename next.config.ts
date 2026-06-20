import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/travel",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;

