import Link from "next/link";
import { getSession } from "@/lib/auth/session";
import { dbQuery } from "@/lib/db/pool";
import AnalystDateRangeBarSuspense from "@/components/analyst/analyst-date-range-bar-suspense";
import {
  analystRangeParams,
  hrefWithDateRange,
} from "@/lib/analyst-date-range";
import { atlLeadSql } from "@/lib/atl-leads";
import { AtlAllLeadsTableClient } from "@/components/portal-leads/atl-all-leads-table-client";
import { UserRole } from "@/lib/constants";

export default async function AnalystTeamLeadLeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; q?: string }>;
}) {
  const session = await getSession();
  if (!session) return null;

  const { from, to, q } = await analystRangeParams(searchParams);

  const analysts = await dbQuery<{ id: string }>(
    `SELECT id FROM "User" WHERE "managerId" = $1 AND role = $2`,
    [session.id, UserRole.LEAD_ANALYST],
  );
  const analystIds = analysts.map((a) => a.id);

  const { clause, params } = atlLeadSql(analystIds, from, to);
  const leadRows =
    analystIds.length === 0
      ? []
      : await dbQuery<{
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
           ORDER BY l."createdAt" DESC`,
          params,
        );

  const mtlRows = await dbQuery<{
    id: string;
    name: string;
    team_name: string;
  }>(
    `SELECT u.id, u.name, t.name AS team_name
     FROM "User" u
     INNER JOIN "Team" t ON t."mainTeamLeadId" = u.id
     WHERE u.role = $1`,
    [UserRole.MAIN_TEAM_LEAD],
  );
  const mtlOptions = mtlRows.map((u) => ({
    id: u.id,
    name: u.name,
    teamName: u.team_name,
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

      <AtlAllLeadsTableClient
        key={`${from ?? ""}|${to ?? ""}`}
        leads={rows}
        initialQ={q}
        from={from}
        to={to}
        analystIdsEmpty={analystIds.length === 0}
        mtlOptions={mtlOptions}
      />
    </div>
  );
}
