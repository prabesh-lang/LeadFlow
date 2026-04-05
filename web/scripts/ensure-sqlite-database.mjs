/**
 * Production / Docker: SQLite cannot open the DB if the parent directory is missing
 * or if migrations never ran (no file). Resolves DATABASE_URL the same way as local
 * dev (paths in file:... are relative to the web package root, next to package.json).
 *
 * For hosted multi-instance deploys, use PostgreSQL (e.g. Supabase) instead of SQLite.
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

function main() {
  const dbUrl = process.env.DATABASE_URL ?? "";
  const absPath = resolveSqlitePath(dbUrl);
  if (!absPath) return;

  const dir = path.dirname(absPath);
  fs.mkdirSync(dir, { recursive: true });
  console.log("[LeadFlow] SQLite file:", absPath);

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
    console.error("[LeadFlow] prisma migrate deploy failed (exit " + result.status + ")");
    process.exit(result.status ?? 1);
  }
}

main();
