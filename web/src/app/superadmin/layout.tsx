import { Inter } from "next/font/google";
import { redirect } from "next/navigation";
import { SuperadminAppShell } from "@/components/superadmin/superadmin-app-shell";
import { getSession } from "@/lib/auth/session";
import { UserRole } from "@/lib/constants";
import { getPortalNotificationsForUser } from "@/lib/portal-notifications";
import { prisma } from "@/lib/prisma";

const inter = Inter({ subsets: ["latin"], display: "swap" });

export default async function SuperadminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session || session.role !== UserRole.SUPERADMIN) {
    redirect("/login");
  }

  const [user, notif] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.id },
      select: { image: true },
    }),
    getPortalNotificationsForUser(session.id),
  ]);

  return (
    <div className={inter.className}>
      <SuperadminAppShell
        session={{ name: session.name, email: session.email }}
        avatarUrl={user?.image ?? null}
        teamName="Superadmin"
        notifications={notif.notifications}
        notificationUnreadCount={notif.unreadCount}
      >
        {children}
      </SuperadminAppShell>
    </div>
  );
}
