"use server";

import { revalidatePath } from "next/cache";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function updateProfile(formData: FormData) {
  const session = await getSession();
  if (!session) return { error: "Unauthorized." };

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Name is required." };

  const nextPassword = String(formData.get("newPassword") ?? "").trim();
  const currentPassword = String(formData.get("currentPassword") ?? "");

  const user = await prisma.user.findUnique({ where: { id: session.id } });
  if (!user) return { error: "User not found." };

  if (nextPassword) {
    if (!currentPassword) {
      return { error: "Enter your current password to set a new one." };
    }
    if (nextPassword.length < 8) {
      return { error: "New password must be at least 8 characters." };
    }
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
  }

  let image: string | null | undefined = undefined;
  const file = formData.get("photo");
  if (file instanceof File && file.size > 0) {
    const ext =
      file.type === "image/png"
        ? "png"
        : file.type === "image/jpeg"
          ? "jpg"
          : null;
    if (!ext) {
      return { error: "Photo must be JPEG or PNG." };
    }
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
      ...(nextPassword ? { provisioningPassword: null } : {}),
      ...(image !== undefined ? { image } : {}),
    },
  });

  revalidatePath("/");
  return { ok: true as const };
}
