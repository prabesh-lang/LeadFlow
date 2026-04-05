/**
 * Run from `postbuild` after `next build` (not on `next start`) so Railway can pass health checks.
 * - SQLite (`file:`): create parent dirs and run `prisma migrate deploy`.
 * - PostgreSQL: `prisma migrate deploy` (Supabase, etc.).
 *
 * Local dev (`next dev`) does not run this; use `npm run db:migrate:deploy` when needed.
 */
import fs from "fs";
import path from "path";
import { spawnSync } from "child_process";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.join(__dirname, "..");

function resolveSqlitePath(dbUrl) {
  const withoutQuery = dbUrl.split("?")[0];
  if (!withoutQuery.startsWith("file:")) return null;
  const rest = withoutQuery.slice("file:".length);
  if (path.isAbsolute(rest)) return path.normalize(rest);
  return path.resolve(webRoot, rest);
}

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
  if (process.env.SKIP_POSTBUILD_MIGRATE === "true") {
    console.log(
      "[LeadFlow] SKIP_POSTBUILD_MIGRATE=true — skipping prisma migrate deploy.",
    );
    return;
  }

  const dbUrl = process.env.DATABASE_URL ?? "";

  if (process.env.RAILWAY_ENVIRONMENT && dbUrl.startsWith("file:")) {
    console.error(
      "[LeadFlow] DATABASE_URL on Railway must be PostgreSQL (Supabase), not SQLite.",
    );
    console.error(
      "  Set DATABASE_URL to postgresql://... from Supabase (Settings → Database → URI).",
    );
    process.exit(1);
  }

  if (dbUrl.startsWith("file:")) {
    const absPath = resolveSqlitePath(dbUrl);
    if (!absPath) return;
    const dir = path.dirname(absPath);
    fs.mkdirSync(dir, { recursive: true });
    console.log("[LeadFlow] SQLite file:", absPath);
    runMigrateDeploy();
    return;
  }

  if (/^postgres(ql)?:\/\//i.test(dbUrl)) {
    console.log("[LeadFlow] Prisma migrate deploy (PostgreSQL)…");
    runMigrateDeploy();
    return;
  }

  console.warn(
    "[LeadFlow] DATABASE_URL is missing or not a file:/postgres URL; skipping migrate deploy.",
  );
}

main();
