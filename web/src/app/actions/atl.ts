"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import {
  authAdminCreateUser,
  authAdminDeleteUser,
} from "@/lib/auth/supabase-admin";
import {
  LeadHandoffAction,
  QualificationStatus,
  SalesStage,
  UserRole,
} from "@/lib/constants";
import { logLeadHandoff } from "@/lib/lead-handoff-log";

export async function createLeadAnalystMember(formData: FormData) {
  const session = await getSession();
  if (!session || session.role !== UserRole.ANALYST_TEAM_LEAD) {
    return { error: "Unauthorized." };
  }

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const analystTeamName = String(
    formData.get("analystTeamName") ?? "",
  ).trim();

  if (!name || !email || !password) {
    return { error: "Name, email, and password are required." };
  }
  if (!analystTeamName) {
    return { error: "Team name is required (use it to group analysts when you have more than one team)." };
  }
  if (password.length < 8) return { error: "Password must be at least 8 characters." };

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return { error: "That email is already in use." };

  let authUserId: string;
  try {
    authUserId = await authAdminCreateUser(email, password);
  } catch (e) {
    console.error("[createLeadAnalystMember] auth create:", e);
    return { error: "Something went wrong. Please try again." };
  }

  try {
    await prisma.user.create({
      data: {
        name,
        email,
        authUserId,
        mustResetPassword: true,
        role: UserRole.LEAD_ANALYST,
        managerId: session.id,
        analystTeamName,
      },
    });
  } catch {
    await authAdminDeleteUser(authUserId).catch(() => {});
    return { error: "Could not save the user profile. Try again." };
  }

  revalidatePath("/analyst-team-lead");
  revalidatePath("/analyst-team-lead/team");
  revalidatePath("/analyst-team-lead/insights");
  return {
    ok: true as const,
    name,
    email,
    analystTeamName,
    temporaryPassword: password,
  };
}

export async function createMainTeamLeadAndTeam(formData: FormData) {
  const session = await getSession();
  if (!session || session.role !== UserRole.ANALYST_TEAM_LEAD) {
    return { error: "Unauthorized." };
  }

  const teamName = String(formData.get("teamName") ?? "").trim();
  const leadName = String(formData.get("leadName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!teamName || !leadName || !email || !password) {
    return { error: "All fields are required." };
  }
  if (password.length < 8) return { error: "Password must be at least 8 characters." };

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return { error: "That email is already in use." };

  let authUserId: string;
  try {
    authUserId = await authAdminCreateUser(email, password);
  } catch (e) {
    console.error("[createMainTeamLeadAndTeam] auth create:", e);
    return { error: "Something went wrong. Please try again." };
  }

  try {
    const mtl = await prisma.user.create({
      data: {
        name: leadName,
        email,
        authUserId,
        mustResetPassword: true,
        role: UserRole.MAIN_TEAM_LEAD,
      },
    });

    const team = await prisma.team.create({
      data: {
        name: teamName,
        mainTeamLeadId: mtl.id,
      },
    });

    await prisma.user.update({
      where: { id: mtl.id },
      data: { teamId: team.id },
    });
  } catch {
    await authAdminDeleteUser(authUserId).catch(() => {});
    return { error: "Could not create team or profile. Try again." };
  }

  revalidatePath("/analyst-team-lead");
  revalidatePath("/analyst-team-lead/team");
  revalidatePath("/analyst-team-lead/insights");
  return {
    ok: true as const,
    teamName,
    leadName,
    email,
    temporaryPassword: password,
  };
}

export async function assignLeadToMainTeamLead(formData: FormData) {
  const session = await getSession();
  if (!session || session.role !== UserRole.ANALYST_TEAM_LEAD) {
    return { error: "Unauthorized." };
  }

  const leadId = String(formData.get("leadId") ?? "");
  const mainTeamLeadId = String(formData.get("mainTeamLeadId") ?? "");

  if (!leadId || !mainTeamLeadId) {
    return { error: "Lead and main team lead are required." };
  }

  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    include: { createdBy: true },
  });
  if (!lead) return { error: "Lead not found." };
  if (lead.qualificationStatus !== QualificationStatus.QUALIFIED) {
    if (lead.qualificationStatus === QualificationStatus.NOT_QUALIFIED) {
      return {
        error:
          "Not qualified leads cannot be routed to a main team. The analyst must set qualification to Qualified first.",
      };
    }
    if (lead.qualificationStatus === QualificationStatus.IRRELEVANT) {
      return {
        error:
          "Irrelevant leads cannot be routed to a main team.",
      };
    }
    return { error: "Only qualified leads can be assigned to a main team." };
  }

  const analystIds = await prisma.user.findMany({
    where: { managerId: session.id, role: UserRole.LEAD_ANALYST },
    select: { id: true },
  });
  const allowedAnalystIds = new Set(analystIds.map((a) => a.id));
  if (!allowedAnalystIds.has(lead.createdById)) {
    return { error: "You can only route leads from analysts on your team." };
  }

  const mtl = await prisma.user.findFirst({
    where: { id: mainTeamLeadId, role: UserRole.MAIN_TEAM_LEAD },
    include: { teamAsMainLead: true },
  });
  if (!mtl?.teamAsMainLead) {
    return { error: "Invalid main team lead." };
  }

  await prisma.lead.update({
    where: { id: leadId },
    data: {
      assignedMainTeamLeadId: mtl.id,
      teamId: mtl.teamAsMainLead.id,
      salesStage: SalesStage.WITH_TEAM_LEAD,
      assignedSalesExecId: null,
      execAssignedAt: null,
      execDeadlineAt: null,
    },
  });

  await logLeadHandoff({
    leadId,
    action: LeadHandoffAction.ROUTED_TO_MAIN_TEAM,
    actorId: session.id,
    detail: `Main team lead: ${mtl.name} · Team: ${mtl.teamAsMainLead.name}`,
  });

  revalidatePath("/analyst-team-lead");
  revalidatePath("/analyst-team-lead/leads");
  revalidatePath("/analyst-team-lead/insights");
  revalidatePath("/team-lead");
  revalidatePath("/analyst");
  return { ok: true as const };
}
