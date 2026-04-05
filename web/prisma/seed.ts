/**
 * Demo data for PostgreSQL (Supabase). Requires DATABASE_URL=postgresql://...
 * and Supabase keys. Run: `npx prisma migrate deploy` then `npx prisma db seed`.
 * Migrating existing SQLite data: use a DB export/import tool or one-off SQL;
 * this script does not import from SQLite automatically.
 */
import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";
import { DEMO_PASSWORD, seedDemoWithAuthIds } from "./seed-demo-data";
import { assertPostgresDatabaseUrl } from "./seed-env";

assertPostgresDatabaseUrl();
const prisma = new PrismaClient();

async function createAuthUser(email: string, password: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error(
      "Seed requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the environment (see web/.env.example).",
    );
  }
  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data, error } = await admin.auth.admin.createUser({
    email: email.trim().toLowerCase(),
    password,
    email_confirm: true,
  });
  if (error) throw new Error(`Supabase auth (${email}): ${error.message}`);
  if (!data.user?.id) throw new Error(`Supabase auth: no user id for ${email}`);
  return data.user.id;
}

async function main() {
  await prisma.lead.deleteMany();
  await prisma.salesExecTeamTransfer.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.teamWhatsApp.deleteMany();
  await prisma.team.deleteMany();
  await prisma.user.deleteMany();

  const ids = {
    superadmin: await createAuthUser("superadmin@demo.local", DEMO_PASSWORD),
    atl: await createAuthUser("atl@demo.local", DEMO_PASSWORD),
    analyst: await createAuthUser("analyst@demo.local", DEMO_PASSWORD),
    mtl: await createAuthUser("mtl@demo.local", DEMO_PASSWORD),
    exec1: await createAuthUser("exec1@demo.local", DEMO_PASSWORD),
    exec2: await createAuthUser("exec2@demo.local", DEMO_PASSWORD),
  };

  await seedDemoWithAuthIds(prisma, ids);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
