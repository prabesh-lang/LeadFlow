import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import AnalystDateRangeBarSuspense from "@/components/analyst/analyst-date-range-bar-suspense";
import {
  analystRangeParams,
  analystRangeSummaryLabel,
} from "@/lib/analyst-date-range";
import { execLeadWhere } from "@/lib/exec-leads";
import { ExecLeadsTableClient } from "@/components/portal-leads/exec-leads-table-client";

export default async function ExecutiveLeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; q?: string }>;
}) {
  const session = await getSession();
  if (!session) return null;

  const { from, to, q } = await analystRangeParams(searchParams);
  const rangeLabel = analystRangeSummaryLabel(from, to);
  const where = execLeadWhere(session.id, from, to);

  const leads = await prisma.lead.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      createdBy: { select: { name: true } },
    },
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
    createdBy: l.createdBy,
  }));

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-lf-text md:text-3xl">
          My leads
        </h1>
        <p className="mt-1 text-sm text-lf-muted">
          Leads assigned to you · {rangeLabel}
        </p>
      </header>

      <AnalystDateRangeBarSuspense />

      <ExecLeadsTableClient
        key={`${from ?? ""}|${to ?? ""}`}
        leads={rows}
        initialQ={q}
      />
    </div>
  );
}
