/**
 * Runs once when the Node.js runtime starts (not during static page build).
 * Use for production sanity checks — avoid throwing (would break deploy).
 */
export function register() {
  if (process.env.NEXT_PHASE === "phase-production-build") {
    return;
  }

  if (process.env.NODE_ENV !== "production") {
    return;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!supabaseUrl || !supabaseAnon) {
    console.warn(
      "[LeadFlow] Production: NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY missing — authentication will not work.",
    );
  }

  const dbUrl = process.env.DATABASE_URL ?? "";
  if (dbUrl.startsWith("file:")) {
    console.warn(
      "[LeadFlow] Production: DATABASE_URL points to a local SQLite file. For a live multi-instance deploy use PostgreSQL (e.g. Supabase) with a pooled connection string; SQLite is only suitable for single-process hosting.",
    );
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) {
    console.warn(
      "[LeadFlow] Production: SUPABASE_SERVICE_ROLE_KEY missing — seed and admin user creation will fail.",
    );
  }
}
