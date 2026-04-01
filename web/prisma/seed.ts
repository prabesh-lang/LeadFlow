import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";
import {
  QualificationStatus,
  SalesStage,
  UserRole,
} from "../src/lib/constants";

const prisma = new PrismaClient();

const DEMO_PASSWORD = "password123";

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
  await prisma.team.deleteMany();
  await prisma.user.deleteMany();

  const superadminAuth = await createAuthUser("superadmin@demo.local", DEMO_PASSWORD);
  const atlAuth = await createAuthUser("atl@demo.local", DEMO_PASSWORD);
  const analystAuth = await createAuthUser("analyst@demo.local", DEMO_PASSWORD);
  const mtlAuth = await createAuthUser("mtl@demo.local", DEMO_PASSWORD);
  const exec1Auth = await createAuthUser("exec1@demo.local", DEMO_PASSWORD);
  const exec2Auth = await createAuthUser("exec2@demo.local", DEMO_PASSWORD);

  await prisma.user.create({
    data: {
      email: "superadmin@demo.local",
      authUserId: superadminAuth,
      name: "Super Admin",
      role: UserRole.SUPERADMIN,
    },
  });

  const atl = await prisma.user.create({
    data: {
      email: "atl@demo.local",
      authUserId: atlAuth,
      name: "Analyst Team Lead",
      role: UserRole.ANALYST_TEAM_LEAD,
      analystTeamName: "Demo analyst org",
    },
  });

  const analyst = await prisma.user.create({
    data: {
      email: "analyst@demo.local",
      authUserId: analystAuth,
      name: "Lead Analyst One",
      role: UserRole.LEAD_ANALYST,
      managerId: atl.id,
      analystTeamName: "Demo analyst team",
    },
  });

  const mtl = await prisma.user.create({
    data: {
      email: "mtl@demo.local",
      authUserId: mtlAuth,
      name: "Main Team Lead — Team Alpha",
      role: UserRole.MAIN_TEAM_LEAD,
    },
  });

  const team = await prisma.team.create({
    data: {
      name: "Team Alpha",
      mainTeamLeadId: mtl.id,
    },
  });

  await prisma.teamWhatsApp.create({
    data: {
      teamId: team.id,
      phone: "+1 555 0100",
      label: "Sales",
      sortOrder: 0,
    },
  });

  await prisma.user.update({
    where: { id: mtl.id },
    data: { teamId: team.id },
  });

  const exec1 = await prisma.user.create({
    data: {
      email: "exec1@demo.local",
      authUserId: exec1Auth,
      name: "Sales Exec One",
      role: UserRole.SALES_EXECUTIVE,
      teamId: team.id,
    },
  });

  await prisma.user.create({
    data: {
      email: "exec2@demo.local",
      authUserId: exec2Auth,
      name: "Sales Exec Two",
      role: UserRole.SALES_EXECUTIVE,
      teamId: team.id,
    },
  });

  await prisma.lead.createMany({
    data: [
      {
        leadName: "Demo Contact One",
        phone: "+919876543210",
        leadEmail: "demo1@example.com",
        source: "Meta Ads / WhatsApp",
        qualificationStatus: QualificationStatus.QUALIFIED,
        leadScore: 78,
        salesStage: SalesStage.PRE_SALES,
        createdById: analyst.id,
        notes: "Enterprise SaaS inquiry",
      },
      {
        leadName: "Demo Contact Two",
        phone: null,
        leadEmail: "demo2@example.com",
        source: "Website / Forms / Chat",
        qualificationStatus: QualificationStatus.NOT_QUALIFIED,
        leadScore: 30,
        salesStage: SalesStage.PRE_SALES,
        createdById: analyst.id,
      },
      {
        leadName: "Demo Contact Three",
        phone: "+919123456789",
        leadEmail: null,
        source: "Meta Ads / WhatsApp",
        qualificationStatus: QualificationStatus.QUALIFIED,
        leadScore: 92,
        salesStage: SalesStage.WITH_TEAM_LEAD,
        createdById: analyst.id,
        assignedMainTeamLeadId: mtl.id,
        teamId: team.id,
      },
      {
        leadName: "Demo Contact Four",
        phone: "+919988776655",
        leadEmail: "demo4@example.com",
        source: "Downloads / Gated content",
        qualificationStatus: QualificationStatus.QUALIFIED,
        leadScore: 65,
        salesStage: SalesStage.WITH_EXECUTIVE,
        createdById: analyst.id,
        assignedMainTeamLeadId: mtl.id,
        teamId: team.id,
        assignedSalesExecId: exec1.id,
        execAssignedAt: new Date(),
        execDeadlineAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      },
    ],
  });
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
