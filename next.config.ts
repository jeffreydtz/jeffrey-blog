import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* /api/reactions valida slugs contra content/posts EN RUNTIME (anti-spam
     de filas, T16): garantizar que el file trace del handler serverless
     incluya los .mdx — el resto del sitio los consume solo en build. */
  outputFileTracingIncludes: {
    "/api/reactions": ["./content/posts/**/*"],
  },
};

export default nextConfig;
