import Link from "next/link";
import { getSession } from "@/lib/auth/session";
import { dbQuery } from "@/lib/db/pool";
import AnalystDateRangeBarSuspense from "@/components/analyst/analyst-date-range-bar-suspense";
import {
  analystRangeParams,
  hrefWithDateRange,
} from "@/lib/analyst-date-range";
import { atlLeadSql } from "@/lib/atl-leads";
import {
  AtlAllLeadsTableClient,
  type ExecOption,
  type MtlOption,
} from "@/components/portal-leads/atl-all-leads-table-client";
import { LeadHandoffAction, UserRole } from "@/lib/constants";
import { PortalPaginationBar } from "@/components/portal-pagination-bar";

export default async function AnalystTeamLeadLeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; q?: string; page?: string; perPage?: string }>;
}) {
  const session = await getSession();
  if (!session) return null;

  const sp = await searchParams;
  const { from, to, q } = await analystRangeParams(sp);
  const pageRaw = Number.parseInt(sp.page ?? "", 10);
  const perPageRaw = Number.parseInt(sp.perPage ?? "", 10);
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1;
  const perPage: 25 | 50 | 100 =
    perPageRaw === 50 || perPageRaw === 100 ? perPageRaw : 25;
  const offset = (page - 1) * perPage;

  const analysts = await dbQuery<{ id: string }>(
    `SELECT id FROM "User" WHERE "managerId" = $1 AND role = $2`,
    [session.id, UserRole.LEAD_ANALYST],
  );
  const analystIds = analysts.map((a) => a.id);

  const { clause, params } = atlLeadSql(analystIds, from, to);
  const [countRows, leadRows] = await (analystIds.length === 0
    ? Promise.resolve([[] as { c: string }[], [] as never[]])
    : Promise.all([
        dbQuery<{ c: string }>(
          `SELECT COUNT(*)::text AS c FROM "Lead" l WHERE ${clause}`,
          params,
        ),
        dbQuery<{
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
        }>(
          `SELECT l.*, cb.name AS cb_name, tm.name AS team_name, mtl.name AS mtl_name, se.name AS se_name
           FROM "Lead" l
           JOIN "User" cb ON cb.id = l."createdById"
           LEFT JOIN "Team" tm ON tm.id = l."teamId"
           LEFT JOIN "User" mtl ON mtl.id = l."assignedMainTeamLeadId"
           LEFT JOIN "User" se ON se.id = l."assignedSalesExecId"
           WHERE ${clause}
           ORDER BY l."createdAt" DESC
           LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
          [...params, perPage, offset],
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

  const leadIds = leadRows.map((l) => l.id);
  const handoffRows =
    leadIds.length === 0
      ? []
      : await dbQuery<{
          lead_id: string;
          created_at: Date;
          action: string;
        }>(
          `SELECT "leadId" AS lead_id, "createdAt" AS created_at, action
           FROM "LeadHandoffLog"
           WHERE "leadId" = ANY($1::text[])
             AND action = ANY($2::text[])
           ORDER BY "createdAt" ASC`,
          [
            leadIds,
            [
              LeadHandoffAction.ROUTED_TO_MAIN_TEAM,
              LeadHandoffAction.ASSIGNED_TO_EXECUTIVE,
              LeadHandoffAction.DIRECT_ASSIGNED_TO_EXECUTIVE_BY_ATL,
            ],
          ],
        );

  const timelineByLead = new Map<
    string,
    {
      routedToMainTeamAt?: Date;
      assignedToExecutiveAt?: Date;
      directAssignedToExecutiveByAtlAt?: Date;
    }
  >();
  for (const h of handoffRows) {
    const t = timelineByLead.get(h.lead_id) ?? {};
    if (
      h.action === LeadHandoffAction.ROUTED_TO_MAIN_TEAM &&
      !t.routedToMainTeamAt
    ) {
      t.routedToMainTeamAt = h.created_at;
    } else if (
      h.action === LeadHandoffAction.ASSIGNED_TO_EXECUTIVE &&
      !t.assignedToExecutiveAt
    ) {
      t.assignedToExecutiveAt = h.created_at;
    } else if (
      h.action === LeadHandoffAction.DIRECT_ASSIGNED_TO_EXECUTIVE_BY_ATL &&
      !t.directAssignedToExecutiveByAtlAt
    ) {
      t.directAssignedToExecutiveByAtlAt = h.created_at;
    }
    timelineByLead.set(h.lead_id, t);
  }

  const rowsWithTimeline = rows.map((r) => {
    const t = timelineByLead.get(r.id);
    return {
      ...r,
      routedToMainTeamAt: t?.routedToMainTeamAt?.toISOString() ?? null,
      assignedToExecutiveAt: t?.assignedToExecutiveAt?.toISOString() ?? null,
      directAssignedToExecutiveByAtlAt:
        t?.directAssignedToExecutiveByAtlAt?.toISOString() ?? null,
    };
  });

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
              href={hrefWithDateRange("/analyst-team-lead", from, to, q)}
              className="text-lf-link hover:underline"
            >
              Back to dashboard
            </Link>
          </p>
        </div>
      </header>

      <AnalystDateRangeBarSuspense />

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
      />
    </div>
  );
}
