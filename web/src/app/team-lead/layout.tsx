import { Inter } from "next/font/google";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { sweepOverdueLeadsGlobal } from "@/lib/deadline";
import { MtlAppShell } from "@/components/mtl/mtl-app-shell";
import { UserRole } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

const inter = Inter({ subsets: ["latin"], display: "swap" });

export default async function TeamLeadLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session || session.role !== UserRole.MAIN_TEAM_LEAD) {
    redirect("/login");
  }
  await sweepOverdueLeadsGlobal();

  const [leadCount, user, team] = await Promise.all([
    prisma.lead.count({ where: { assignedMainTeamLeadId: session.id } }),
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
      <MtlAppShell
        leadCount={leadCount}
        session={{ name: session.name, email: session.email }}
        avatarUrl={user?.image ?? null}
        teamName={team?.name ?? null}
      >
        {children}
      </MtlAppShell>
    </div>
  );
}
