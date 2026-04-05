"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import {
  authAdminCreateUser,
  authAdminDeleteUser,
  authAdminUpdatePassword,
} from "@/lib/auth/supabase-admin";
import { UserRole } from "@/lib/constants";

async function requireSuperAdmin() {
  const session = await getSession();
  if (!session || session.role !== UserRole.SUPERADMIN) return null;
  return session;
}

export async function superadminCreateUser(formData: FormData) {
  const session = await requireSuperAdmin();
  if (!session) return { error: "Unauthorized." };

  const role = String(formData.get("role") ?? "").trim();
  if (
    role !== UserRole.LEAD_ANALYST &&
    role !== UserRole.ANALYST_TEAM_LEAD
  ) {
    return { error: "Only Lead Analyst or Analyst Team Lead can be created here." };
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
    console.error("[superadminCreateUser] auth create:", e);
    return { error: "Something went wrong. Please try again." };
  }

  try {
    if (role === UserRole.LEAD_ANALYST) {
      const managerId = String(formData.get("managerId") ?? "").trim();
      const analystTeamName = String(formData.get("analystTeamName") ?? "").trim();
      if (!managerId) {
        await authAdminDeleteUser(authUserId);
        return { error: "Lead analyst requires an Analyst Team Lead (manager)." };
      }
      if (!analystTeamName) {
        await authAdminDeleteUser(authUserId);
        return { error: "Analyst team name is required for lead analysts." };
      }
      const mgr = await prisma.user.findFirst({
        where: { id: managerId, role: UserRole.ANALYST_TEAM_LEAD },
      });
      if (!mgr) {
        await authAdminDeleteUser(authUserId);
        return { error: "Invalid Analyst Team Lead." };
      }

      await prisma.user.create({
        data: {
          name,
          email,
          authUserId,
          mustResetPassword: true,
          role: UserRole.LEAD_ANALYST,
          managerId,
          analystTeamName,
        },
      });
    } else {
      const analystTeamName = String(
        formData.get("analystTeamName") ?? "",
      ).trim();
      if (!analystTeamName) {
        await authAdminDeleteUser(authUserId);
        return { error: "Team name is required for Analyst Team Lead." };
      }
      await prisma.user.create({
        data: {
          name,
          email,
          authUserId,
          mustResetPassword: true,
          role: UserRole.ANALYST_TEAM_LEAD,
          analystTeamName,
        },
      });
    }
  } catch {
    await authAdminDeleteUser(authUserId).catch(() => {});
    return { error: "Could not save the user profile. Try again." };
  }

  revalidatePath("/superadmin");
  return { ok: true as const, temporaryPassword: password };
}

export async function superadminCreateUserFormAction(
  _prev: { error?: string; temporaryPassword?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string; temporaryPassword?: string } | undefined> {
  const r = await superadminCreateUser(formData);
  if (r && "error" in r) return { error: r.error };
  if (r && "ok" in r && r.ok && "temporaryPassword" in r) {
    return { temporaryPassword: r.temporaryPassword };
  }
  return undefined;
}

export async function superadminSetUserPassword(formData: FormData) {
  const session = await requireSuperAdmin();
  if (!session) return { error: "Unauthorized." };

  const userId = String(formData.get("userId") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!userId || !password) {
    return { error: "User and password are required." };
  }
  if (password.length < 8) return { error: "Password must be at least 8 characters." };

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.role === UserRole.SUPERADMIN) {
    return { error: "Cannot change password for this account." };
  }
  if (!user.authUserId) {
    return {
      error:
        "This user is not linked to Supabase Auth; set password in the Supabase dashboard or recreate the user.",
    };
  }

  try {
    await authAdminUpdatePassword(user.authUserId, password);
  } catch (e) {
    console.error("[superadminSetUserPassword]", e);
    return { error: "Something went wrong. Please try again." };
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      mustResetPassword: false,
    },
  });

  revalidatePath("/superadmin");
  return { ok: true as const };
}

export async function superadminSetPasswordFormAction(
  _prev: { error?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string } | undefined> {
  const r = await superadminSetUserPassword(formData);
  if (r && "error" in r) return { error: r.error };
  return undefined;
}

export async function superadminDeleteUser(formData: FormData) {
  const session = await requireSuperAdmin();
  if (!session) return { error: "Unauthorized." };

  const userId = String(formData.get("userId") ?? "").trim();
  if (!userId) return { error: "User is required." };
  if (userId === session.id) {
    return { error: "You cannot delete your own account." };
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.role === UserRole.SUPERADMIN) {
    return { error: "Cannot delete this account." };
  }

  const authId = user.authUserId;

  try {
    await prisma.user.delete({ where: { id: userId } });
    if (authId) {
      await authAdminDeleteUser(authId).catch(() => {
        // Profile removed; auth user may remain — clean up in Supabase Dashboard if needed.
      });
    }
  } catch {
    return {
      error:
        "Could not delete user (they may still have dependent records such as team members or leads).",
    };
  }

  revalidatePath("/superadmin");
  return { ok: true as const };
}

export async function superadminDeleteUserFormAction(
  _prev: { error?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string } | undefined> {
  const r = await superadminDeleteUser(formData);
  if (r && "error" in r) return { error: r.error };
  return undefined;
}
