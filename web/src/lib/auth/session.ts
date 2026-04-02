import { prisma } from "@/lib/prisma";
import {
  createSupabaseServerClient,
  isSupabaseConfigured,
} from "@/lib/supabase/server";
import { logSessionOrDataError } from "@/lib/server/log";

/** No cookie / not signed in — Supabase returns this; not a server failure. */
function isMissingSessionError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  if ("name" in err && err.name === "AuthSessionMissingError") return true;
  const msg =
    "message" in err && typeof (err as { message?: unknown }).message === "string"
      ? (err as { message: string }).message
      : "";
  return /session missing/i.test(msg);
}

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
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError) {
      if (!isMissingSessionError(authError)) {
        logSessionOrDataError("getSession.auth", authError);
      }
      return null;
    }
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
  } catch (e) {
    // Let Next.js mark the route dynamic (cookies / headers); do not swallow as "no session".
    if (
      e instanceof Error &&
      (e.message.includes("Dynamic server usage") ||
        e.message.includes("couldn't be rendered statically"))
    ) {
      throw e;
    }
    logSessionOrDataError("getSession", e);
    return null;
  }
}

export async function destroySession() {
  if (!isSupabaseConfigured()) {
    return;
  }
  try {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  } catch (e) {
    logSessionOrDataError("destroySession", e);
  }
}
