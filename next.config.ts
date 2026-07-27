import type { NextConfig } from "next";

const r2Hostname = process.env.R2_PUBLIC_URL
  ?.replace(/^https?:\/\//, "")
  ?.split("/")[0]

const nextConfig: NextConfig = {
  cacheComponents: true,
  ...(r2Hostname
    ? {
        images: {
          remotePatterns: [
            {
              protocol: "https",
              hostname: r2Hostname,
            },
          ],
        },
      }
    : {}),
};

export default nextConfig;
