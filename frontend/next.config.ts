import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/eventspace",
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
