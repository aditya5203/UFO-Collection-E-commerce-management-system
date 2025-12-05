import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // allow loading images from localhost / private IPs in dev
    dangerouslyAllowLocalIP: true,

    remotePatterns: [
      // backend product images: http://localhost:8080/uploads/...
      {
        protocol: "http",
        hostname: "localhost",
        port: "8080",
        pathname: "/uploads/**",
      },
      // Google avatars (if using Google OAuth)
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        port: "",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
