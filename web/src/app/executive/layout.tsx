import { Inter } from "next/font/google";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { sweepOverdueLeadsGlobal } from "@/lib/deadline";
import { ExecAppShell } from "@/components/exec/exec-app-shell";
import { UserRole } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

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
  await sweepOverdueLeadsGlobal();

  const [leadCount, user, team] = await Promise.all([
    prisma.lead.count({ where: { assignedSalesExecId: session.id } }),
    prisma.user.findUnique({
      where: { id: session.id },
      select: { image: true },
    }),
    session.teamId
      ? prisma.team.findUnique({
          where: { id: session.teamId },
          select: { name: true },
        })
      : null,
  ]);

  return (
    <div className={inter.className}>
      <ExecAppShell
        leadCount={leadCount}
        session={{ name: session.name, email: session.email }}
        avatarUrl={user?.image ?? null}
        teamName={team?.name ?? null}
      >
        {children}
      </ExecAppShell>
    </div>
  );
}
