import { withCn } from "cn/next";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        as: "*.css",
        loaders: ["@tailwindcss/turbopack"],
      },
    },
  },
};

export default withCn(nextConfig, {
  content: ["src/**/*.{ts,tsx}"],
  css: "src/app/globals.css",
  out: "src/lib/cn-tables.ts",
});
