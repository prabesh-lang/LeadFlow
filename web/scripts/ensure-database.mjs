/**
 * Runs `prisma migrate deploy` when DATABASE_URL is PostgreSQL.
 * Invoked from `postbuild` (after `next build`) and from `start` (after `railway-db-guard`).
 *
 * During postbuild the database is not yet available (DATABASE_URL is injected at runtime
 * in containerised deployments), so migrations are always skipped at build time and only
 * executed when the service actually starts via `npm start`.
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
  // During postbuild the real DATABASE_URL is not available — it is injected at runtime.
  // Always skip migrations here; they will run when the service starts via `npm start`.
  if (process.env.npm_lifecycle_event === "postbuild") {
    console.log(
      "[LeadFlow] postbuild phase — skipping prisma migrate deploy. Migrations will run at runtime (npm start).",
    );
    return;
  }

  const dbUrl = (process.env.DATABASE_URL ?? "").trim();

  if (!dbUrl) {
    console.warn(
      "[LeadFlow] DATABASE_URL is not set — skipping prisma migrate deploy.",
    );
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

  if (!/^postgres(ql)?:\/\//i.test(dbUrl)) {
    console.warn(
      "[LeadFlow] DATABASE_URL does not look like a PostgreSQL URL — skipping prisma migrate deploy.",
    );
    console.warn(
      "[LeadFlow] Set DATABASE_URL to postgresql://... from Supabase (Settings → Database → URI).",
    );
    return;
  }

  console.log("[LeadFlow] prisma migrate deploy (PostgreSQL)…");
  runMigrateDeploy();
}

main();
