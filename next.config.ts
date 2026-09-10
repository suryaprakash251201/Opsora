import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: true,
  // Allow LAN access during development (e.g. http://10.10.10.3:9942).
  // Add any additional hostnames your dev machine resolves to.
  allowedDevOrigins: [
    "10.10.10.3",
    "100.67.251.1",
    "localhost",
    "127.0.0.1",
    "::1",
    "0.0.0.0",
    "opsora.local",
    "*.opsora.local",
  ],
};

export default nextConfig;
