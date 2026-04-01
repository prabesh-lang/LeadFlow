import { prisma } from "@/lib/prisma";
import { EXEC_DEADLINE_DAYS, SalesStage, UserRole } from "@/lib/constants";

function addDays(d: Date, days: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

/** Reassign leads whose exec deadline passed and are still active with an executive. */
export async function sweepOverdueLeadsForTeam(teamId: string) {
  const now = new Date();
  const overdue = await prisma.lead.findMany({
    where: {
      teamId,
      salesStage: SalesStage.WITH_EXECUTIVE,
      execDeadlineAt: { lt: now },
    },
  });
  if (overdue.length === 0) return;

  const execs = await prisma.user.findMany({
    where: { teamId, role: UserRole.SALES_EXECUTIVE },
    orderBy: { name: "asc" },
  });
  if (execs.length === 0) return;

  for (const lead of overdue) {
    const currentId = lead.assignedSalesExecId;
    const others = execs.filter((e) => e.id !== currentId);
    const pool = others.length > 0 ? others : execs;
    const idx =
      lead.internalReassignCount >= 0
        ? lead.internalReassignCount % pool.length
        : 0;
    const next = pool[idx];

    await prisma.lead.update({
      where: { id: lead.id },
      data: {
        assignedSalesExecId: next.id,
        execAssignedAt: now,
        execDeadlineAt: addDays(now, EXEC_DEADLINE_DAYS),
        internalReassignCount: { increment: 1 },
      },
    });
  }
}

export async function sweepOverdueLeadsGlobal() {
  const teams = await prisma.team.findMany({ select: { id: true } });
  for (const t of teams) {
    await sweepOverdueLeadsForTeam(t.id);
  }
}
