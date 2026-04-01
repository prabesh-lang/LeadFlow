"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import {
  authAdminCreateUser,
  authAdminDeleteUser,
} from "@/lib/auth/supabase-admin";
import {
  EXEC_DEADLINE_DAYS,
  LeadHandoffAction,
  SalesStage,
  UserRole,
} from "@/lib/constants";
import { logLeadHandoff } from "@/lib/lead-handoff-log";

function addDays(d: Date, days: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

export async function createSalesExecutive(formData: FormData) {
  const session = await getSession();
  if (!session || session.role !== UserRole.MAIN_TEAM_LEAD) {
    return { error: "Unauthorized." };
  }

  if (!session.teamId) {
    return { error: "Your account is not linked to a team." };
  }

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!name || !email || !password) {
    return { error: "Name, email, and password are required." };
  }
  if (password.length < 8) return { error: "Password must be at least 8 characters." };

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return { error: "That email is already in use." };

  let authUserId: string;
  try {
    authUserId = await authAdminCreateUser(email, password);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Could not create auth user.";
    return { error: msg };
  }

  try {
    await prisma.user.create({
      data: {
        name,
        email,
        authUserId,
        provisioningPassword: password,
        role: UserRole.SALES_EXECUTIVE,
        teamId: session.teamId,
      },
    });
  } catch {
    await authAdminDeleteUser(authUserId).catch(() => {});
    return { error: "Could not save the user profile. Try again." };
  }

  revalidatePath("/team-lead");
  revalidatePath("/team-lead/leads");
  revalidatePath("/team-lead/team");
  return {
    ok: true as const,
    name,
    email,
    temporaryPassword: password,
  };
}

export async function assignLeadToExecutive(formData: FormData) {
  const session = await getSession();
  if (!session || session.role !== UserRole.MAIN_TEAM_LEAD) {
    return { error: "Unauthorized." };
  }

  const leadId = String(formData.get("leadId") ?? "");
  const execId = String(formData.get("salesExecId") ?? "");

  if (!leadId || !execId) {
    return { error: "Lead and sales executive are required." };
  }

  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!lead) return { error: "Lead not found." };
  if (lead.assignedMainTeamLeadId !== session.id) {
    return { error: "This lead is not assigned to you." };
  }

  const exec = await prisma.user.findFirst({
    where: {
      id: execId,
      role: UserRole.SALES_EXECUTIVE,
      teamId: lead.teamId ?? undefined,
    },
  });
  if (!exec) return { error: "Invalid sales executive for this team." };

  const now = new Date();
  await prisma.lead.update({
    where: { id: leadId },
    data: {
      assignedSalesExecId: exec.id,
      salesStage: SalesStage.WITH_EXECUTIVE,
      execAssignedAt: now,
      execDeadlineAt: addDays(now, EXEC_DEADLINE_DAYS),
    },
  });

  await logLeadHandoff({
    leadId,
    action: LeadHandoffAction.ASSIGNED_TO_EXECUTIVE,
    actorId: session.id,
    detail: `Sales executive: ${exec.name} (${exec.email})`,
  });

  revalidatePath("/team-lead");
  revalidatePath("/team-lead/leads");
  revalidatePath("/executive");
  revalidatePath("/analyst");
  revalidatePath("/analyst-team-lead");
  return { ok: true as const };
}

/**
 * Move a sales executive from the current MTL’s team to another team.
 * Active leads (WITH_EXECUTIVE) assigned by this MTL to that rep are returned to WITH_TEAM_LEAD without an exec.
 */
export async function transferSalesExecutiveToTeam(formData: FormData) {
  const session = await getSession();
  if (!session || session.role !== UserRole.MAIN_TEAM_LEAD) {
    return { error: "Unauthorized." };
  }
  if (!session.teamId) {
    return { error: "Your account is not linked to a team." };
  }

  const salesExecId = String(formData.get("salesExecId") ?? "").trim();
  const targetTeamId = String(formData.get("targetTeamId") ?? "").trim();

  if (!salesExecId || !targetTeamId) {
    return { error: "Sales executive and destination team are required." };
  }
  if (targetTeamId === session.teamId) {
    return { error: "Choose a team other than the current one." };
  }

  const exec = await prisma.user.findFirst({
    where: {
      id: salesExecId,
      role: UserRole.SALES_EXECUTIVE,
      teamId: session.teamId,
    },
  });
  if (!exec) {
    return { error: "That sales executive is not on your team." };
  }

  const targetTeam = await prisma.team.findUnique({
    where: { id: targetTeamId },
  });
  if (!targetTeam) {
    return { error: "Destination team not found." };
  }

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: salesExecId },
      data: { teamId: targetTeamId },
    });

    await tx.lead.updateMany({
      where: {
        assignedSalesExecId: salesExecId,
        assignedMainTeamLeadId: session.id,
        salesStage: SalesStage.WITH_EXECUTIVE,
      },
      data: {
        assignedSalesExecId: null,
        salesStage: SalesStage.WITH_TEAM_LEAD,
        execAssignedAt: null,
        execDeadlineAt: null,
      },
    });

    await tx.salesExecTeamTransfer.create({
      data: {
        salesExecId,
        fromTeamId: session.teamId,
        toTeamId: targetTeamId,
        transferredById: session.id,
      },
    });
  });

  revalidatePath("/team-lead", "layout");
  revalidatePath("/executive");
  revalidatePath("/analyst");
  revalidatePath("/analyst-team-lead");
  revalidatePath("/superadmin");
  return { ok: true as const };
}
