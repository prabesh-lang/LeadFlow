/**
 * Fast check before `next start` on Railway — does not run migrations.
 * Migrations run in `postbuild` via ensure-database.mjs so the HTTP server starts quickly.
 */
const dbUrl = process.env.DATABASE_URL ?? "";

if (process.env.RAILWAY_ENVIRONMENT && dbUrl.startsWith("file:")) {
  console.error(
    "[LeadFlow] DATABASE_URL on Railway must be PostgreSQL (Supabase), not SQLite (file:...).",
  );
  console.error(
    "  Railway → Variables → set DATABASE_URL to postgresql://... from Supabase (port 5432).",
  );
  process.exit(1);
}
