import path from "path";
import type { NextConfig } from "next";

// Prisma's SQLite "file:" URLs resolve relative to the schema's location at
// generate time (packages/db/prisma), not this app's cwd, so a relative
// DATABASE_URL set in apps/web/.env silently fails to open the database.
// Resolve an absolute path here instead, so the app works from any checkout.
process.env.DATABASE_URL = `file:${path
  .resolve(__dirname, "../../packages/db/dev.db")
  .replace(/\\/g, "/")}`;

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname, "../.."),
  // The Next.js dev-mode "N" badge (bottom-left) is unrelated to this app
  // and was getting confused for part of its UI; it's dev-only anyway.
  devIndicators: false,
};

export default nextConfig;
