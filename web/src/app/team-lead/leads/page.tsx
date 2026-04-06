import { getSession } from "@/lib/auth/session";
import { dbQuery } from "@/lib/db/pool";
import AnalystDateRangeBarSuspense from "@/components/analyst/analyst-date-range-bar-suspense";
import {
  analystRangeParams,
  analystRangeSummaryLabel,
} from "@/lib/analyst-date-range";
import { mtlLeadSql } from "@/lib/mtl-leads";
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
  const { clause, params } = mtlLeadSql(session.id, from, to);

  const leadRows = await dbQuery<{
    id: string;
    leadName: string;
    phone: string | null;
    leadEmail: string | null;
    source: string;
    notes: string | null;
    lostNotes: string | null;
    leadScore: number | null;
    salesStage: string;
    execDeadlineAt: Date | null;
    assignedSalesExecId: string | null;
    cb_name: string;
    se_id: string | null;
    se_name: string | null;
  }>(
    `SELECT l.*, cb.name AS cb_name, se.id AS se_id, se.name AS se_name
     FROM "Lead" l
     JOIN "User" cb ON cb.id = l."createdById"
     LEFT JOIN "User" se ON se.id = l."assignedSalesExecId"
     WHERE ${clause}
     ORDER BY l."createdAt" DESC`,
    params,
  );

  const execs =
    session.teamId == null
      ? []
      : await dbQuery<{ id: string; name: string }>(
          `SELECT id, name FROM "User" WHERE "teamId" = $1 AND role = $2 ORDER BY name ASC`,
          [session.teamId, UserRole.SALES_EXECUTIVE],
        );

  const rows = leadRows.map((l) => ({
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
    createdBy: { name: l.cb_name },
    assignedSalesExec:
      l.se_id && l.se_name
        ? { id: l.se_id, name: l.se_name }
        : null,
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
        rangeLabel={rangeLabel}
      />
    </div>
  );
}
