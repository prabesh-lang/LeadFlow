import Link from "next/link";
import { getSession } from "@/lib/auth/session";
import { dbQuery, dbQueryOne } from "@/lib/db/pool";
import AnalystDateRangeBar from "@/components/analyst/analyst-date-range-bar";
import { UnifiedPortalReportSections } from "@/components/reports/unified-portal-report-sections";
import { DashboardReportExport } from "@/components/dashboard-report-export";
import {
  analystRangeParams,
  analystRangeSummaryLabel,
  hrefWithDateRange,
  preservedSearchParamEntriesForDateBar,
} from "@/lib/analyst-date-range";
import { atlLeadSql } from "@/lib/atl-leads";
import { UserRole } from "@/lib/constants";
import { buildUnifiedDashboardViewModel } from "@/lib/unified-dashboard-report";

type LeadDashRow = {
  id: string;
  leadName: string;
  source: string;
  sourceWebsiteName: string | null;
  sourceMetaProfileName: string | null;
  qualificationStatus: string;
  salesStage: string;
  leadScore: number | null;
  phone: string | null;
  country: string | null;
  city: string | null;
  createdAt: Date;
  notes: string | null;
  lostNotes: string | null;
  createdById: string;
  assignedSalesExecId: string | null;
  cb_name: string;
  cb_email: string;
  se_name: string | null;
};

export default async function AnalystTeamLeadDashboard({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const session = await getSession();
  if (!session) return null;

  const [preservedEntries, { from, to }] = await Promise.all([
    preservedSearchParamEntriesForDateBar(searchParams),
    analystRangeParams(searchParams),
  ]);
  const rangeLabel = analystRangeSummaryLabel(from, to);

  const analystsList = await dbQuery<{ id: string; name: string }>(
    `SELECT id, name FROM "User" WHERE "managerId" = $1 AND role = $2 ORDER BY name ASC`,
    [session.id, UserRole.LEAD_ANALYST],
  );
  const analystIds = analystsList.map((a) => a.id);

  const { clause, params } = atlLeadSql(analystIds, from, to);
  const leads =
    analystIds.length === 0
      ? []
      : await dbQuery<LeadDashRow>(
          `SELECT l.*, cb.name AS cb_name, cb.email AS cb_email, se.name AS se_name
           FROM "Lead" l
           JOIN "User" cb ON cb.id = l."createdById"
           LEFT JOIN "User" se ON se.id = l."assignedSalesExecId"
           WHERE ${clause}
           ORDER BY l."createdAt" DESC`,
          params,
        );

  const teamCountRow = await dbQueryOne<{ c: string }>(
    `SELECT COUNT(*)::text AS c FROM "Team"`,
  );
  const teamCount = Number(teamCountRow?.c ?? 0);
  const generatedAt = new Date().toISOString();

  const unifiedRows = leads.map((l) => ({
    id: l.id,
    leadName: l.leadName,
    source: l.source,
    sourceWebsiteName: l.sourceWebsiteName,
    sourceMetaProfileName: l.sourceMetaProfileName,
    qualificationStatus: l.qualificationStatus,
    salesStage: l.salesStage,
    leadScore: l.leadScore,
    phone: l.phone,
    country: l.country,
    city: l.city,
    createdAt: l.createdAt,
    notes: l.notes,
    lostNotes: l.lostNotes,
    createdById: l.createdById,
    createdByEmail: l.cb_email,
    createdByName: l.cb_name,
    assignedSalesExecId: l.assignedSalesExecId,
    assignedRepName: l.se_name ?? null,
  }));

  const vm = buildUnifiedDashboardViewModel(unifiedRows, {
    kind: "analyst_team_lead",
    rangeLabel,
    generatedAt,
    fileNamePrefix: "leadflow-dashboard",
    reportTitle: "LeadFlow dashboard report",
    reportSubtitle: `ATL · ${session.name} · ${analystsList.length} analyst${analystsList.length === 1 ? "" : "s"}`,
    analystName: session.name,
    analystEmail: session.email,
    analystCount: analystsList.length,
    teamCount,
  });

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-lf-text md:text-3xl">
            Dashboard
          </h1>
          <p className="mt-1 max-w-xl text-sm leading-relaxed text-lf-muted">
            Same report layout and export as every portal ·{" "}
            {analystsList.length} analyst
            {analystsList.length === 1 ? "" : "s"} · {teamCount} sales team
            {teamCount === 1 ? "" : "s"}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <DashboardReportExport payload={vm.exportPayload} />
          <Link
            href="/analyst-team-lead/team"
            className="rounded-lg bg-lf-accent px-4 py-2.5 text-sm font-semibold text-lf-on-accent shadow-lg shadow-[#c62828]/30 hover:bg-lf-accent-hover"
          >
            Members
          </Link>
        </div>
      </header>

      <AnalystDateRangeBar
        pathname="/analyst-team-lead"
        defaultFrom={from ?? ""}
        defaultTo={to ?? ""}
        preservedEntries={preservedEntries}
      />

      <UnifiedPortalReportSections
        vm={vm}
        countrySubtitle="Phone country (E.164) for your analysts' leads in this range. Each row splits qualified, not qualified, and irrelevant. Sorted by total leads; the list shows the top 10 countries by default when there are more."
        leadsHref={hrefWithDateRange("/analyst-team-lead/leads", from, to)}
        recentLeadsTitle="Recent team leads"
      />
    </div>
  );
}
