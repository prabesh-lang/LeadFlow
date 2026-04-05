import { prisma } from "@/lib/prisma";
import type { AtlNotificationItem } from "@/components/atl/atl-notification-bell";

export async function getPortalNotificationsForUser(userId: string): Promise<{
  notifications: AtlNotificationItem[];
  unreadCount: number;
}> {
  const [notificationRows, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { recipientId: userId },
      orderBy: { createdAt: "desc" },
      take: 40,
      select: {
        id: true,
        title: true,
        body: true,
        read: true,
        leadId: true,
        createdAt: true,
      },
    }),
    prisma.notification.count({
      where: { recipientId: userId, read: false },
    }),
  ]);

  const notifications: AtlNotificationItem[] = notificationRows.map((n) => ({
    id: n.id,
    title: n.title,
    body: n.body,
    read: n.read,
    leadId: n.leadId,
    createdAt: n.createdAt.toISOString(),
  }));

  return { notifications, unreadCount };
}
