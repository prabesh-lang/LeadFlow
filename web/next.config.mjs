import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Prisma: avoid bundling engine into server chunks incorrectly in production.
  serverExternalPackages: ["@prisma/client", "prisma"],
  // This Next app lives in `web/`. Pin Turbopack root to this folder (not the
  // monorepo parent): otherwise Next picks `LeadFlow/` when multiple
  // lockfiles exist, which breaks `@/` imports AND `@import "tailwindcss"`.
  // Dev/build use `--webpack` so hoisted `@supabase/*` resolves from the monorepo root.
  turbopack: {
    root: __dirname,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "6mb",
    },
  },
};

export default nextConfig;
