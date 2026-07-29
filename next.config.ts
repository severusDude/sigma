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
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
