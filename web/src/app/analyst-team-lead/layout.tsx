import { Inter } from "next/font/google";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { sweepOverdueLeadsGlobal } from "@/lib/deadline";
import { AtlAppShell } from "@/components/atl/atl-app-shell";
import type { AtlNotificationItem } from "@/components/atl/atl-notification-bell";
import { UserRole } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { atlLeadWhere } from "@/lib/atl-leads";

const inter = Inter({ subsets: ["latin"], display: "swap" });

export default async function AnalystTeamLeadLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session || session.role !== UserRole.ANALYST_TEAM_LEAD) {
    redirect("/login");
  }
  await sweepOverdueLeadsGlobal();

  const analysts = await prisma.user.findMany({
    where: { managerId: session.id, role: UserRole.LEAD_ANALYST },
    select: { id: true },
  });
  const analystIds = analysts.map((a) => a.id);

  const leadCount =
    analystIds.length === 0
      ? 0
      : await prisma.lead.count({
          where: atlLeadWhere(analystIds, null, null),
        });

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: { image: true },
  });

  const [notificationRows, unreadNotificationCount] = await Promise.all([
    prisma.notification.findMany({
      where: { recipientId: session.id },
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
      where: { recipientId: session.id, read: false },
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

  return (
    <div className={inter.className}>
      <AtlAppShell
        leadCount={leadCount}
        session={{ name: session.name, email: session.email }}
        avatarUrl={user?.image ?? null}
        notifications={notifications}
        notificationUnreadCount={unreadNotificationCount}
      >
        {children}
      </AtlAppShell>
    </div>
  );
}
