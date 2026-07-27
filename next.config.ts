import type { NextConfig } from "next";

const r2Hostname = process.env.R2_PUBLIC_URL
  ?.replace(/^https?:\/\//, "")
  ?.split("/")[0]

const nextConfig: NextConfig = {
  cacheComponents: true,
  images: {
    loader: "custom",
    loaderFile: "./lib/image-loader.ts",
    deviceSizes: [64, 128, 256, 384, 512],
    imageSizes: [32, 48, 64],
    ...(r2Hostname
      ? {
          remotePatterns: [
            {
              protocol: "https",
              hostname: r2Hostname,
              pathname: "/sigma-storage/**",
            },
          ],
        }
      : {}),
  },
};

export default nextConfig;
