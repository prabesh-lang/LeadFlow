"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { UserRole } from "@/lib/constants";

export async function markAtlNotificationRead(notificationId: string) {
  const session = await getSession();
  if (!session || session.role !== UserRole.ANALYST_TEAM_LEAD) {
    return { error: "Unauthorized." };
  }

  const n = await prisma.notification.findFirst({
    where: { id: notificationId, recipientId: session.id },
    select: { id: true },
  });
  if (!n) return { error: "Not found." };

  await prisma.notification.update({
    where: { id: notificationId },
    data: { read: true },
  });

  revalidatePath("/analyst-team-lead", "layout");
  return { ok: true as const };
}

export async function markAllAtlNotificationsRead() {
  const session = await getSession();
  if (!session || session.role !== UserRole.ANALYST_TEAM_LEAD) {
    return { error: "Unauthorized." };
  }

  await prisma.notification.updateMany({
    where: { recipientId: session.id, read: false },
    data: { read: true },
  });

  revalidatePath("/analyst-team-lead", "layout");
  return { ok: true as const };
}
