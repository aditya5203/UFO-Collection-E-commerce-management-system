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

      // ✅ Cloudinary images
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },

      // Google avatars (Google OAuth)
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**",
      },

      // Example domain used in docs/samples
      {
        protocol: "https",
        hostname: "example.com",
        pathname: "/**",
      },

      // Stock image (ftcdn)
      {
        protocol: "https",
        hostname: "t3.ftcdn.net",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
