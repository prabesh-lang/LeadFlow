import { prisma } from "@/lib/prisma";
import {
  createSupabaseServerClient,
  isSupabaseConfigured,
} from "@/lib/supabase/server";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: string;
  teamId: string | null;
};

export async function getSession(): Promise<SessionUser | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.id) return null;

  const email = (user.email ?? "").trim().toLowerCase();
  let profile = await prisma.user.findFirst({
    where: {
      OR: [{ authUserId: user.id }, ...(email ? [{ email }] : [])],
    },
  });

  if (!profile) return null;

  if (profile.authUserId !== user.id) {
    profile = await prisma.user.update({
      where: { id: profile.id },
      data: { authUserId: user.id },
    });
  }

  return {
    id: profile.id,
    email: profile.email,
    name: profile.name,
    role: profile.role,
    teamId: profile.teamId,
  };
}

export async function destroySession() {
  if (!isSupabaseConfigured()) {
    return;
  }
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
}
