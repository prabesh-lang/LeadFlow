import { Inter } from "next/font/google";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { sweepOverdueLeadsGlobal } from "@/lib/deadline";
import { AnalystAppShell } from "@/components/analyst/analyst-app-shell";
import { UserRole } from "@/lib/constants";
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
  await sweepOverdueLeadsGlobal();

  const [leadCount, user] = await Promise.all([
    prisma.lead.count({ where: { createdById: session.id } }),
    prisma.user.findUnique({
      where: { id: session.id },
      select: { image: true },
    }),
  ]);

  return (
    <div className={inter.className}>
      <AnalystAppShell
        leadCount={leadCount}
        session={{ name: session.name, email: session.email }}
        avatarUrl={user?.image ?? null}
      >
        {children}
      </AnalystAppShell>
    </div>
  );
}
