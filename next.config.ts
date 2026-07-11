import type { NextConfig } from "next";
import { BASE_PATH } from "./src/lib/base-path";

const nextConfig: NextConfig = {
  basePath: BASE_PATH,
  turbopack: { root: process.cwd() },
};

export default nextConfig;
