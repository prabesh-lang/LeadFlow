import { dbQuery } from "@/lib/db/pool";
import type { AtlNotificationItem } from "@/components/atl/atl-notification-bell";

export async function getPortalNotificationsForUser(userId: string): Promise<{
  notifications: AtlNotificationItem[];
  unreadCount: number;
}> {
  const [notificationRows, unreadRows] = await Promise.all([
    dbQuery<{
      id: string;
      title: string;
      body: string | null;
      read: boolean;
      leadId: string | null;
      createdAt: Date;
    }>(
      `SELECT id, title, body, "read", "leadId", "createdAt" FROM "Notification"
       WHERE "recipientId" = $1 ORDER BY "createdAt" DESC LIMIT 40`,
      [userId],
    ),
    dbQuery<{ c: string }>(
      `SELECT COUNT(*)::text as c FROM "Notification" WHERE "recipientId" = $1 AND "read" = false`,
      [userId],
    ),
  ]);

  const unreadCount = Number(unreadRows[0]?.c ?? 0);

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
