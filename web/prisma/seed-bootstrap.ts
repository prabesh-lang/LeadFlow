/**
 * One-time demo bootstrap when the app database has no users (e.g. fresh Railway deploy).
 * Runs only when RAILWAY_ENVIRONMENT is set and LEADFLOW_SKIP_AUTO_BOOTSTRAP is not "true".
 * Idempotent: skips if any User row exists. Safe if Supabase Auth users already exist.
 */
import { PrismaClient, Prisma } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";
import {
  DEMO_PASSWORD,
  seedDemoWithAuthIds,
  type DemoAuthIds,
} from "./seed-demo-data";
import { assertPostgresDatabaseUrl } from "./seed-env";

async function getOrCreateAuthUser(email: string, password: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error(
      "Bootstrap requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
    );
  }
  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const normalized = email.trim().toLowerCase();
  const { data: created, error } = await admin.auth.admin.createUser({
    email: normalized,
    password,
    email_confirm: true,
  });
  if (!error && created.user?.id) return created.user.id;

  const { data: listData, error: listErr } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  if (listErr) {
    throw new Error(`Supabase auth (${email}): ${listErr.message}`);
  }
  const found = listData.users?.find(
    (u) => (u.email ?? "").toLowerCase() === normalized,
  );
  if (found?.id) return found.id;

  throw new Error(
    error?.message ??
      `Could not create or find Supabase auth user for ${email}`,
  );
}

async function loadAuthIds(): Promise<DemoAuthIds> {
  return {
    superadmin: await getOrCreateAuthUser(
      "superadmin@demo.local",
      DEMO_PASSWORD,
    ),
    atl: await getOrCreateAuthUser("atl@demo.local", DEMO_PASSWORD),
    analyst: await getOrCreateAuthUser("analyst@demo.local", DEMO_PASSWORD),
    mtl: await getOrCreateAuthUser("mtl@demo.local", DEMO_PASSWORD),
    exec1: await getOrCreateAuthUser("exec1@demo.local", DEMO_PASSWORD),
    exec2: await getOrCreateAuthUser("exec2@demo.local", DEMO_PASSWORD),
  };
}

async function main() {
  assertPostgresDatabaseUrl();
  const prisma = new PrismaClient();

  const quick = await prisma.user.count();
  if (quick > 0) {
    console.log("[LeadFlow] bootstrap: users already exist, skipping.");
    await prisma.$disconnect();
    return;
  }

  const ids = await loadAuthIds();

  try {
    await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(41820319)`;
      const n = await tx.user.count();
      if (n > 0) return;
      await seedDemoWithAuthIds(tx, ids);
    });
    console.log("[LeadFlow] bootstrap: demo data created.");
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      console.log(
        "[LeadFlow] bootstrap: another replica created users first; skipping.",
      );
    } else {
      throw e;
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
