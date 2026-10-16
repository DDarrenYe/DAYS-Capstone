import { withCn } from "cn/next";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  outputFileTracingIncludes: {
    "/instructor/reports/export": [
      "./node_modules/@fontsource/inter/files/inter-*-{400,600}-normal.woff",
    ],
  },
  partialPrefetching: true,
  experimental: {
    serverActions: { bodySizeLimit: "4.2mb" },
  },
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
