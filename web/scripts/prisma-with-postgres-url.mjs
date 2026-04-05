/**
 * Prisma requires DATABASE_URL to match the datasource provider. During local transition
 * or CI, .env may still point at SQLite; for `generate` and `validate` only, use a
 * placeholder postgres URL when the real URL is not PostgreSQL.
 */
import { spawnSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.join(__dirname, "..");

const env = { ...process.env };
const url = env.DATABASE_URL ?? "";
if (
  !url.startsWith("postgres://") &&
  !url.startsWith("postgresql://")
) {
  env.DATABASE_URL = "postgresql://127.0.0.1:5432/placeholder";
}

const prismaBin = path.join(webRoot, "node_modules", ".bin", "prisma");
const args = process.argv.slice(2);
if (args.length === 0) {
  console.error("Usage: node prisma-with-postgres-url.mjs <prisma-args...>");
  process.exit(1);
}
const r = spawnSync(prismaBin, args, { stdio: "inherit", env, cwd: webRoot });
process.exit(r.status ?? 0);
