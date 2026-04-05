import { Inter } from "next/font/google";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { sweepOverdueLeadsGlobal } from "@/lib/deadline";
import { AtlAppShell } from "@/components/atl/atl-app-shell";
import { UserRole } from "@/lib/constants";
import { getPortalNotificationsForUser } from "@/lib/portal-notifications";
import { prisma } from "@/lib/prisma";

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

  const [user, notif] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.id },
      select: { image: true, analystTeamName: true },
    }),
    getPortalNotificationsForUser(session.id),
  ]);

  const teamName =
    user?.analystTeamName?.trim() || "Analyst team lead";

  return (
    <div className={inter.className}>
      <AtlAppShell
        session={{ name: session.name, email: session.email }}
        avatarUrl={user?.image ?? null}
        teamName={teamName}
        notifications={notif.notifications}
        notificationUnreadCount={notif.unreadCount}
      >
        {children}
      </AtlAppShell>
    </div>
  );
}
