import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The console is dynamic per request (DB-backed, per-analyst state), so the
  // static-first cacheComponents mode is not a fit. Streaming via <Suspense>
  // still gives us skeleton loaders during navigation.
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
