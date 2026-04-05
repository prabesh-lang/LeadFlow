import { Inter } from "next/font/google";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { AnalystAppShell } from "@/components/analyst/analyst-app-shell";
import { UserRole } from "@/lib/constants";
import { redirectIfMustResetPassword } from "@/lib/auth-redirects";
import { getPortalNotificationsForUser } from "@/lib/portal-notifications";
import { prisma } from "@/lib/prisma";

const inter = Inter({ subsets: ["latin"], display: "swap" });

export default async function AnalystLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session || session.role !== UserRole.LEAD_ANALYST) {
    redirect("/login");
  }
  await redirectIfMustResetPassword();

  const [user, notif] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.id },
      select: { image: true, analystTeamName: true },
    }),
    getPortalNotificationsForUser(session.id),
  ]);

  const teamName =
    user?.analystTeamName?.trim() || "Lead Analyst";

  return (
    <div className={inter.className}>
      <AnalystAppShell
        session={{ name: session.name, email: session.email }}
        avatarUrl={user?.image ?? null}
        teamName={teamName}
        notifications={notif.notifications}
        notificationUnreadCount={notif.unreadCount}
      >
        {children}
      </AnalystAppShell>
    </div>
  );
}
