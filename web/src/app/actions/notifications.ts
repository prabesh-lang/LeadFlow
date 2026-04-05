"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

const LAYOUT_ROOTS = [
  "/analyst",
  "/analyst-team-lead",
  "/team-lead",
  "/executive",
  "/superadmin",
] as const;

function revalidatePortalLayouts() {
  for (const p of LAYOUT_ROOTS) {
    revalidatePath(p, "layout");
  }
}

export async function markNotificationRead(notificationId: string) {
  const session = await getSession();
  if (!session) return { error: "Unauthorized." };

  const n = await prisma.notification.findFirst({
    where: { id: notificationId, recipientId: session.id },
    select: { id: true },
  });
  if (!n) return { error: "Not found." };

  await prisma.notification.update({
    where: { id: notificationId },
    data: { read: true },
  });

  revalidatePortalLayouts();
  return { ok: true as const };
}

export async function markAllNotificationsRead() {
  const session = await getSession();
  if (!session) return { error: "Unauthorized." };

  await prisma.notification.updateMany({
    where: { recipientId: session.id, read: false },
    data: { read: true },
  });

  revalidatePortalLayouts();
  return { ok: true as const };
}
