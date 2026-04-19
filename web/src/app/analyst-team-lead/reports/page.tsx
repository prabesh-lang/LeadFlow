import Link from "next/link";
import { getSession } from "@/lib/auth/session";
import AnalystDateRangeBar from "@/components/analyst/analyst-date-range-bar";
import { UnifiedPortalReportSections } from "@/components/reports/unified-portal-report-sections";
import { DashboardReportExport } from "@/components/dashboard-report-export";
import { buildAtlTeamLeadDashboardViewModel } from "@/lib/atl-team-lead-dashboard-vm";
import {
  analystRangeParams,
  preservedSearchParamEntriesForDateBar,
} from "@/lib/analyst-date-range";

export default async function AnalystTeamLeadReportsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getSession();
  if (!session) return null;

  const sp = await searchParams;
  const [preservedEntries, { from, to }] = await Promise.all([
    preservedSearchParamEntriesForDateBar(sp),
    analystRangeParams(sp),
  ]);

  const { vm, analystsList, teamCount, rangeLabel } =
    await buildAtlTeamLeadDashboardViewModel(session, from, to);

  const countrySubtitle =
    rangeLabel === "All time"
      ? "Phone country (E.164) for your analysts' leads (all time). Each row splits qualified, not qualified, and irrelevant. Sorted by total leads; the list shows the top 10 countries by default when there are more."
      : `Phone country (E.164) for your analysts' leads in this range (${rangeLabel}). Each row splits qualified, not qualified, and irrelevant. Sorted by total leads; the list shows the top 10 countries by default when there are more.`;

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-lf-text md:text-3xl">
            Report
          </h1>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-lf-muted">
            Single consolidated view — KPIs, funnel, analysts, routing to sales,
            geography, and conversion. Filter by{" "}
            <span className="font-medium text-lf-text-secondary">
              lead creation date
            </span>{" "}
            below, or leave unset for all time. {analystsList.length} analyst
            {analystsList.length === 1 ? "" : "s"} · {teamCount} sales team
            {teamCount === 1 ? "" : "s"}.
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
        key={`${from ?? ""}|${to ?? ""}`}
        pathname="/analyst-team-lead/reports"
        defaultFrom={from ?? ""}
        defaultTo={to ?? ""}
        preservedEntries={preservedEntries}
        rangeSummary={rangeLabel}
      />

      <UnifiedPortalReportSections
        vm={vm}
        countrySubtitle={countrySubtitle}
        leadsHref="/analyst-team-lead/leads"
        recentLeadsTitle="Recent team leads"
      />
    </div>
  );
}
