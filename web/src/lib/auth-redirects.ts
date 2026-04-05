import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";

/** Send users who must complete a mandatory password reset to `/reset-password`. */
export async function redirectIfMustResetPassword() {
  const session = await getSession();
  if (!session) return;
  const u = await prisma.user.findUnique({
    where: { id: session.id },
    select: { mustResetPassword: true },
  });
  if (u?.mustResetPassword) {
    redirect("/reset-password");
  }
}
