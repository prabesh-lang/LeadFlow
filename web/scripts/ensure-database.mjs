/**
 * Runs `prisma migrate deploy` when DATABASE_URL is PostgreSQL.
 * Invoked from `postbuild` (after `next build`) and from `start` (after `railway-db-guard`).
 *
 * Prisma schema uses PostgreSQL only — `file:` URLs are skipped with a warning (no process.exit).
 * Local dev (`next dev`) does not run this; use `npm run db:migrate:deploy` when needed.
 */
import fs from "fs";
import path from "path";
import { spawnSync } from "child_process";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.join(__dirname, "..");

function runMigrateDeploy() {
  const prismaBin = path.join(webRoot, "node_modules", ".bin", "prisma");
  if (!fs.existsSync(prismaBin)) {
    console.warn(
      "[LeadFlow] prisma CLI missing; cannot run migrate deploy. Check node_modules install.",
    );
    return;
  }
  const result = spawnSync(prismaBin, ["migrate", "deploy"], {
    cwd: webRoot,
    stdio: "inherit",
    env: process.env,
  });
  if (result.status !== 0) {
    console.error(
      "[LeadFlow] prisma migrate deploy failed (exit " + result.status + ")",
    );
    process.exit(result.status ?? 1);
  }
}

function main() {
  // Only used during `npm run build` → postbuild (e.g. root `npm run qa`). Runtime `npm start` must still migrate.
  if (
    process.env.npm_lifecycle_event === "postbuild" &&
    process.env.SKIP_POSTBUILD_MIGRATE === "true"
  ) {
    console.log(
      "[LeadFlow] SKIP_POSTBUILD_MIGRATE=true — skipping prisma migrate deploy in postbuild.",
    );
    return;
  }

  const dbUrl = (process.env.DATABASE_URL ?? "").trim();

  if (/^postgres(ql)?:\/\//i.test(dbUrl)) {
    console.log("[LeadFlow] prisma migrate deploy (PostgreSQL)…");
    runMigrateDeploy();
    return;
  }

  if (dbUrl.startsWith("file:")) {
    console.warn(
      "[LeadFlow] DATABASE_URL is file: (SQLite-style). This app uses PostgreSQL — set DATABASE_URL to your Supabase URI (postgresql://...).",
    );
    console.warn(
      "[LeadFlow] Skipping migrate deploy until DATABASE_URL is PostgreSQL.",
    );
    return;
  }

  console.warn(
    "[LeadFlow] DATABASE_URL is missing or not postgres — skipping migrate deploy.",
  );
}

main();
