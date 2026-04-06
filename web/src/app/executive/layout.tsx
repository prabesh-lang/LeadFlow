import { Inter } from "next/font/google";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { ExecAppShell } from "@/components/exec/exec-app-shell";
import { UserRole } from "@/lib/constants";
import { redirectIfMustResetPassword } from "@/lib/auth-redirects";
import { getPortalNotificationsForUser } from "@/lib/portal-notifications";
import { dbQueryOne } from "@/lib/db/pool";

const inter = Inter({ subsets: ["latin"], display: "swap" });

export default async function ExecutiveLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session || session.role !== UserRole.SALES_EXECUTIVE) {
    redirect("/login");
  }
  await redirectIfMustResetPassword();

  const [user, team, notif] = await Promise.all([
    dbQueryOne<{ image: string | null }>(
      `SELECT image FROM "User" WHERE id = $1`,
      [session.id],
    ),
    session.teamId
      ? dbQueryOne<{ name: string }>(
          `SELECT name FROM "Team" WHERE id = $1`,
          [session.teamId],
        )
      : Promise.resolve(null),
    getPortalNotificationsForUser(session.id),
  ]);

  const teamName = team?.name?.trim() || "Sales team";

  return (
    <div className={inter.className}>
      <ExecAppShell
        session={{ name: session.name, email: session.email }}
        avatarUrl={user?.image ?? null}
        teamName={teamName}
        notifications={notif.notifications}
        notificationUnreadCount={notif.unreadCount}
      >
        {children}
      </ExecAppShell>
    </div>
  );
}
