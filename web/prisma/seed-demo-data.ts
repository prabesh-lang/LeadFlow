import type { PrismaClient } from "@prisma/client";
import {
  QualificationStatus,
  SalesStage,
  UserRole,
} from "../src/lib/constants";

export const DEMO_PASSWORD = "password123";

export type DemoAuthIds = {
  superadmin: string;
  atl: string;
  analyst: string;
  mtl: string;
  exec1: string;
  exec2: string;
};

/**
 * Railway bootstrap: one Supabase Auth user + one portal user (superadmin only).
 */
export async function seedBootstrapSuperAdminOnly(
  prisma: Pick<PrismaClient, "user">,
  superadminAuthId: string,
) {
  await prisma.user.create({
    data: {
      email: "superadmin@demo.local",
      authUserId: superadminAuthId,
      name: "Super Admin",
      role: UserRole.SUPERADMIN,
      mustResetPassword: false,
    },
  });
}

/**
 * Inserts demo users, team, and leads. Callers must clear tables first (full seed)
 * or ensure the database is empty (bootstrap).
 */
export async function seedDemoWithAuthIds(
  prisma: Pick<
    PrismaClient,
    "user" | "team" | "teamWhatsApp" | "lead"
  >,
  ids: DemoAuthIds,
) {
  await prisma.user.create({
    data: {
      email: "superadmin@demo.local",
      authUserId: ids.superadmin,
      name: "Super Admin",
      role: UserRole.SUPERADMIN,
    },
  });

  const atl = await prisma.user.create({
    data: {
      email: "atl@demo.local",
      authUserId: ids.atl,
      name: "Analyst Team Lead",
      role: UserRole.ANALYST_TEAM_LEAD,
      analystTeamName: "Demo analyst org",
    },
  });

  const analyst = await prisma.user.create({
    data: {
      email: "analyst@demo.local",
      authUserId: ids.analyst,
      name: "Lead Analyst One",
      role: UserRole.LEAD_ANALYST,
      managerId: atl.id,
      analystTeamName: "Demo analyst team",
    },
  });

  const mtl = await prisma.user.create({
    data: {
      email: "mtl@demo.local",
      authUserId: ids.mtl,
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
      authUserId: ids.exec1,
      name: "Sales Exec One",
      role: UserRole.SALES_EXECUTIVE,
      teamId: team.id,
    },
  });

  await prisma.user.create({
    data: {
      email: "exec2@demo.local",
      authUserId: ids.exec2,
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
