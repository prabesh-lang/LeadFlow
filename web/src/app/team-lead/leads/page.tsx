import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import AnalystDateRangeBarSuspense from "@/components/analyst/analyst-date-range-bar-suspense";
import {
  analystRangeParams,
  analystRangeSummaryLabel,
} from "@/lib/analyst-date-range";
import { mtlLeadWhere } from "@/lib/mtl-leads";
import { MtlLeadsTableClient } from "@/components/portal-leads/mtl-leads-table-client";
import { UserRole } from "@/lib/constants";

export default async function TeamLeadLeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; q?: string }>;
}) {
  const session = await getSession();
  if (!session) return null;

  const { from, to, q } = await analystRangeParams(searchParams);
  const rangeLabel = analystRangeSummaryLabel(from, to);
  const where = mtlLeadWhere(session.id, from, to);

  const leads = await prisma.lead.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      createdBy: { select: { name: true } },
      assignedSalesExec: { select: { name: true, id: true } },
    },
  });

  const execs =
    session.teamId == null
      ? []
      : await prisma.user.findMany({
          where: {
            teamId: session.teamId,
            role: UserRole.SALES_EXECUTIVE,
          },
          orderBy: { name: "asc" },
        });

  const rows = leads.map((l) => ({
    id: l.id,
    leadName: l.leadName,
    phone: l.phone,
    leadEmail: l.leadEmail,
    source: l.source,
    notes: l.notes,
    lostNotes: l.lostNotes,
    leadScore: l.leadScore,
    salesStage: l.salesStage,
    execDeadlineAt: l.execDeadlineAt?.toISOString() ?? null,
    assignedSalesExecId: l.assignedSalesExecId,
    createdBy: l.createdBy,
    assignedSalesExec: l.assignedSalesExec,
  }));

  const execOptions = execs.map((e) => ({ id: e.id, name: e.name }));

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-lf-text md:text-3xl">
          All leads
        </h1>
        <p className="mt-1 text-sm text-lf-muted">
          Qualified leads routed to you · {rangeLabel}
        </p>
      </header>

      <AnalystDateRangeBarSuspense />

      <MtlLeadsTableClient
        key={`${from ?? ""}|${to ?? ""}`}
        leads={rows}
        initialQ={q}
        execs={execOptions}
      />
    </div>
  );
}
