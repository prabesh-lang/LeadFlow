import "server-only";

import { revalidatePath } from "next/cache";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { UserRole } from "@/lib/constants";

export type PortalSettingsResult =
  | { error: string; ok?: undefined }
  | { ok: true; image?: string | null; error?: undefined };

function portalSettingsRoles() {
  return [
    UserRole.LEAD_ANALYST,
    UserRole.ANALYST_TEAM_LEAD,
    UserRole.MAIN_TEAM_LEAD,
    UserRole.SALES_EXECUTIVE,
    UserRole.SUPERADMIN,
  ] as const;
}

export function canUsePortalSettings(role: string | undefined) {
  return (portalSettingsRoles() as readonly string[]).includes(role ?? "");
}

async function revalidatePortalLayouts() {
  revalidatePath("/analyst", "layout");
  revalidatePath("/analyst-team-lead", "layout");
  revalidatePath("/team-lead", "layout");
  revalidatePath("/executive", "layout");
  revalidatePath("/superadmin", "layout");
}

export async function runPortalProfileUpdate(
  formData: FormData,
): Promise<PortalSettingsResult> {
  const session = await getSession();
  if (!session || !canUsePortalSettings(session.role)) {
    return { error: "Unauthorized." };
  }

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Name is required." };

  const user = await prisma.user.findUnique({ where: { id: session.id } });
  if (!user) return { error: "User not found." };

  let image: string | null | undefined = undefined;
  const file = formData.get("photo");
  if (file instanceof File && file.size > 0) {
    const ext =
      file.type === "image/png"
        ? "png"
        : file.type === "image/jpeg"
          ? "jpg"
          : null;
    if (!ext) return { error: "Photo must be JPEG or PNG." };
    const buf = Buffer.from(await file.arrayBuffer());
    const dir = path.join(process.cwd(), "public", "uploads");
    await mkdir(dir, { recursive: true });
    const filename = `${session.id}.${ext}`;
    await writeFile(path.join(dir, filename), buf);
    image = `/uploads/${filename}`;
  }

  await prisma.user.update({
    where: { id: session.id },
    data: {
      name,
      ...(image !== undefined ? { image } : {}),
    },
  });

  const fresh = await prisma.user.findUnique({ where: { id: session.id } });

  try {
    await revalidatePortalLayouts();
  } catch {
    // revalidatePath can throw outside a full request lifecycle in edge cases.
  }
  return { ok: true as const, image: fresh?.image ?? null };
}

export async function runPortalPasswordUpdate(
  formData: FormData,
): Promise<PortalSettingsResult> {
  const session = await getSession();
  if (!session || !canUsePortalSettings(session.role)) {
    return { error: "Unauthorized." };
  }

  const currentPassword = String(formData.get("currentPassword") ?? "");
  const nextPassword = String(formData.get("newPassword") ?? "").trim();

  if (!nextPassword) return { error: "New password is required." };
  if (nextPassword.length < 8) {
    return { error: "New password must be at least 8 characters." };
  }
  if (!currentPassword) {
    return { error: "Enter your current password." };
  }

  const user = await prisma.user.findUnique({ where: { id: session.id } });
  if (!user) return { error: "User not found." };
  if (!user.authUserId) {
    return {
      error:
        "This account is not linked to Supabase Auth. Contact an administrator.",
    };
  }

  const supabase = await createSupabaseServerClient();
  const { error: verifyErr } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  });
  if (verifyErr) {
    return { error: "Current password is incorrect." };
  }

  const { error: updateErr } = await supabase.auth.updateUser({
    password: nextPassword,
  });
  if (updateErr) {
    return { error: updateErr.message };
  }

  await prisma.user.update({
    where: { id: session.id },
    data: { provisioningPassword: null },
  });

  try {
    await revalidatePortalLayouts();
  } catch {
    // ignore
  }
  return { ok: true as const };
}
