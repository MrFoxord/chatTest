import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    MONGODB_URI: process.env.NEXT_PUBLIC_MONGODB_URI || 'mongodb://localhost:27017/chatDatabase?authSource=admin',
  },
};

export default nextConfig;
