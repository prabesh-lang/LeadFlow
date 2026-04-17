import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { connection } from "next/server";
import { getSession } from "@/lib/auth/session";
import { dbQuery } from "@/lib/db/pool";
import AnalystDateRangeBar from "@/components/analyst/analyst-date-range-bar";
import {
  analystRangeParams,
  analystRangeSummaryLabel,
  hrefWithDateRange,
  preservedSearchParamEntriesForDateBar,
  searchParamFirst,
} from "@/lib/analyst-date-range";
import { atlLeadSql } from "@/lib/atl-leads";
import { fetchAtlRoutingTimelines } from "@/lib/atl-routing-timeline";
import {
  AtlAllLeadsTableClient,
  type ExecOption,
  type MtlOption,
} from "@/components/portal-leads/atl-all-leads-table-client";
import { UserRole } from "@/lib/constants";
import { PortalPaginationBar } from "@/components/portal-pagination-bar";
import { PORTAL_LEADS_EXPORT_ROW_CAP } from "@/lib/portal-leads-export-cap";
import type { PortalAtlLeadExportRow } from "@/lib/portal-all-leads-export-payloads";

type AtlJoinedRow = {
  id: string;
  leadName: string;
  phone: string | null;
  leadEmail: string | null;
  source: string;
  notes: string | null;
  lostNotes: string | null;
  qualificationStatus: string;
  leadScore: number | null;
  salesStage: string;
  createdAt: Date;
  teamId: string | null;
  assignedMainTeamLeadId: string | null;
  cb_name: string;
  team_name: string | null;
  mtl_name: string | null;
  se_name: string | null;
};

function mapAtlRowsWithTimeline(
  leadRows: AtlJoinedRow[],
  timelineByLead: Awaited<ReturnType<typeof fetchAtlRoutingTimelines>>,
) {
  const rows = leadRows.map((l) => ({
    id: l.id,
    leadName: l.leadName,
    phone: l.phone,
    leadEmail: l.leadEmail,
    source: l.source,
    notes: l.notes,
    lostNotes: l.lostNotes,
    qualificationStatus: l.qualificationStatus,
    leadScore: l.leadScore,
    salesStage: l.salesStage,
    createdAt: l.createdAt.toISOString(),
    teamId: l.teamId,
    assignedMainTeamLeadId: l.assignedMainTeamLeadId,
    createdBy: { name: l.cb_name },
    team: l.team_name ? { name: l.team_name } : null,
    assignedMainTeamLead: l.mtl_name ? { name: l.mtl_name } : null,
    assignedSalesExec: l.se_name ? { name: l.se_name } : null,
  }));

  return rows.map((r) => {
    const t = timelineByLead.get(r.id);
    return {
      ...r,
      routedToMainTeamAt: t?.routedToMainTeamAt?.toISOString() ?? null,
      assignedToExecutiveAt: t?.assignedToExecutiveAt?.toISOString() ?? null,
      directAssignedToExecutiveByAtlAt:
        t?.directAssignedToExecutiveByAtlAt?.toISOString() ?? null,
    };
  });
}

function toAtlExportRows(
  leadRows: AtlJoinedRow[],
  timelineByLead: Awaited<ReturnType<typeof fetchAtlRoutingTimelines>>,
): PortalAtlLeadExportRow[] {
  return leadRows.map((l) => {
    const t = timelineByLead.get(l.id);
    return {
      leadName: l.leadName,
      phone: l.phone,
      leadEmail: l.leadEmail,
      source: l.source,
      notes: l.notes,
      lostNotes: l.lostNotes,
      qualificationStatus: l.qualificationStatus,
      leadScore: l.leadScore,
      salesStage: l.salesStage,
      createdAt: l.createdAt.toISOString(),
      analystName: l.cb_name,
      teamName: l.team_name,
      mtlName: l.mtl_name,
      repName: l.se_name,
      routedToMainTeamAt: t?.routedToMainTeamAt?.toISOString() ?? null,
      assignedToExecutiveAt: t?.assignedToExecutiveAt?.toISOString() ?? null,
      directAssignedToExecutiveByAtlAt:
        t?.directAssignedToExecutiveByAtlAt?.toISOString() ?? null,
    };
  });
}

export default async function AnalystTeamLeadLeadsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  noStore();
  await connection();

  const session = await getSession();
  if (!session) return null;

  const sp = await searchParams;
  const [preservedEntries, { from, to, q }] = await Promise.all([
    preservedSearchParamEntriesForDateBar(sp),
    analystRangeParams(sp),
  ]);
  const pageRaw = Number.parseInt(searchParamFirst(sp, "page") ?? "", 10);
  const perPageRaw = Number.parseInt(searchParamFirst(sp, "perPage") ?? "", 10);
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1;
  const perPage: 25 | 50 | 100 =
    perPageRaw === 50 || perPageRaw === 100 ? perPageRaw : 25;
  const offset = (page - 1) * perPage;
  const rangeLabel = analystRangeSummaryLabel(from, to);

  const analysts = await dbQuery<{ id: string }>(
    `SELECT id FROM "User" WHERE "managerId" = $1 AND role = $2`,
    [session.id, UserRole.LEAD_ANALYST],
  );
  const analystIds = analysts.map((a) => a.id);

  const { clause, params } = atlLeadSql(analystIds, from, to);
  const atlSelect = `SELECT l.*, cb.name AS cb_name, tm.name AS team_name, mtl.name AS mtl_name, se.name AS se_name
           FROM "Lead" l
           JOIN "User" cb ON cb.id = l."createdById"
           LEFT JOIN "Team" tm ON tm.id = l."teamId"
           LEFT JOIN "User" mtl ON mtl.id = l."assignedMainTeamLeadId"
           LEFT JOIN "User" se ON se.id = l."assignedSalesExecId"
           WHERE ${clause}
           ORDER BY l."createdAt" DESC`;

  const [countRows, leadRows, exportLeadRows] = await (analystIds.length === 0
    ? Promise.resolve([[] as { c: string }[], [] as AtlJoinedRow[], [] as AtlJoinedRow[]])
    : Promise.all([
        dbQuery<{ c: string }>(
          `SELECT COUNT(*)::text AS c FROM "Lead" l WHERE ${clause}`,
          params,
        ),
        dbQuery<AtlJoinedRow>(
          `${atlSelect}
           LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
          [...params, perPage, offset],
        ),
        dbQuery<AtlJoinedRow>(
          `${atlSelect}
           LIMIT $${params.length + 1}`,
          [...params, PORTAL_LEADS_EXPORT_ROW_CAP],
        ),
      ]));
  const totalCount = Number(countRows[0]?.c ?? 0);

  const mtlRows = await dbQuery<{
    id: string;
    name: string;
    team_id: string;
    team_name: string;
  }>(
    `SELECT u.id, u.name, t.id AS team_id, t.name AS team_name
     FROM "User" u
     INNER JOIN "Team" t ON t."mainTeamLeadId" = u.id
     WHERE u.role = $1`,
    [UserRole.MAIN_TEAM_LEAD],
  );
  const mtlOptions: MtlOption[] = mtlRows.map((u) => ({
    id: u.id,
    name: u.name,
    teamId: u.team_id,
    teamName: u.team_name,
  }));

  const execRows = await dbQuery<{
    id: string;
    name: string;
    email: string;
    team_id: string | null;
  }>(
    `SELECT id, name, email, "teamId" AS team_id
     FROM "User"
     WHERE role = $1
     ORDER BY name ASC`,
    [UserRole.SALES_EXECUTIVE],
  );
  const execOptions: ExecOption[] = execRows
    .filter((u): u is { id: string; name: string; email: string; team_id: string } =>
      Boolean(u.team_id),
    )
    .map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      teamId: u.team_id,
    }));

  const [pagedTimeline, exportTimeline] = await Promise.all([
    fetchAtlRoutingTimelines(leadRows.map((l) => l.id)),
    fetchAtlRoutingTimelines(exportLeadRows.map((l) => l.id)),
  ]);

  const rowsWithTimeline = mapAtlRowsWithTimeline(leadRows, pagedTimeline);
  const atlExportLeads = toAtlExportRows(exportLeadRows, exportTimeline);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-lf-text md:text-3xl">
            All leads
          </h1>
          <p className="mt-1 text-sm text-lf-muted">
            Leads created by your analysts ·{" "}
            <Link
              href={hrefWithDateRange("/analyst-team-lead/reports", from, to, q)}
              className="text-lf-link hover:underline"
            >
              Back to report
            </Link>
          </p>
        </div>
      </header>

      <AnalystDateRangeBar
        key={`${from ?? ""}|${to ?? ""}`}
        pathname="/analyst-team-lead/leads"
        defaultFrom={from ?? ""}
        defaultTo={to ?? ""}
        preservedEntries={preservedEntries}
        rangeSummary={rangeLabel}
      />

      <PortalPaginationBar
        pathname="/analyst-team-lead/leads"
        query={{ from, to, q }}
        page={page}
        perPage={perPage}
        totalCount={totalCount}
      />

      <AtlAllLeadsTableClient
        key={`${from ?? ""}|${to ?? ""}|${page}|${perPage}`}
        leads={rowsWithTimeline}
        initialQ={q}
        from={from}
        to={to}
        analystIdsEmpty={analystIds.length === 0}
        mtlOptions={mtlOptions}
        execOptions={execOptions}
        rangeLabel={rangeLabel}
        exportLeads={atlExportLeads}
        rangeTotalCount={totalCount}
        exportRowCount={exportLeadRows.length}
      />
    </div>
  );
}
