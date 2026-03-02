import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@stellar/stellar-sdk"],
  // Silence "multiple lockfiles" warning: use project root for file tracing (we use npm, not pnpm).
  ...(process.env.NODE_ENV === "production" && {
    outputFileTracingRoot: path.join(__dirname),
  }),
};

export default nextConfig;
