"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { RateLimiterMemory } from "rate-limiter-flexible";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import {
  createSupabaseServerClient,
  isSupabaseConfigured,
} from "@/lib/supabase/server";
import { homePathForRole } from "@/lib/role-home";

const loginRateLimiter = new RateLimiterMemory({
  points: 5,
  duration: 60,
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function loginAction(formData: FormData) {
  const rawEmail = String(formData.get("email") ?? "").trim().toLowerCase();
  const rawPassword = String(formData.get("password") ?? "");
  const parsed = loginSchema.safeParse({
    email: rawEmail,
    password: rawPassword,
  });
  if (!parsed.success) {
    return { error: "Invalid input. Please check your fields." };
  }
  const email = parsed.data.email;
  const password = parsed.data.password;

  if (!isSupabaseConfigured()) {
    return {
      error:
        "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (see .env.example).",
    };
  }

  const h = await headers();
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    h.get("x-real-ip") ??
    "unknown";
  try {
    await loginRateLimiter.consume(ip);
  } catch {
    return {
      error:
        "Too many login attempts. Please wait 60 seconds and try again.",
    };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return { error: "Invalid email or password." };
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    await supabase.auth.signOut();
    return {
      error:
        "No portal profile exists for this account. Ask an administrator to create your user in LeadFlow.",
    };
  }

  if (user.mustResetPassword) {
    redirect("/reset-password");
  }

  redirect(homePathForRole(user.role) ?? "/login");
}

export async function logoutAction() {
  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  }
  redirect("/login");
}

export async function completeMandatoryPasswordResetAction(formData: FormData) {
  const session = await getSession();
  if (!session) return { error: "Unauthorized." };

  const password = String(formData.get("password") ?? "");
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  const user = await prisma.user.findUnique({ where: { id: session.id } });
  if (!user?.mustResetPassword) {
    return { error: "Password reset is not required for this account." };
  }
  if (!user.authUserId) {
    return {
      error:
        "This account is not linked to Supabase Auth. Contact an administrator.",
    };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    console.error("[completeMandatoryPasswordResetAction]", error);
    return { error: "Something went wrong. Please try again." };
  }

  await prisma.user.update({
    where: { id: session.id },
    data: { mustResetPassword: false },
  });

  revalidatePath("/", "layout");
  return {
    ok: true as const,
    redirectTo: homePathForRole(user.role) ?? "/login",
  };
}
