import Link from "next/link";
import { getSession } from "@/lib/auth/session";
import { UnifiedPortalReportSections } from "@/components/reports/unified-portal-report-sections";
import { hrefWithDateRange } from "@/lib/analyst-date-range";
import { buildAtlTeamLeadDashboardViewModel } from "@/lib/atl-team-lead-dashboard-vm";

export default async function AnalystTeamLeadDashboard() {
  const session = await getSession();
  if (!session) return null;

  const { vm, analystsList, teamCount } =
    await buildAtlTeamLeadDashboardViewModel(session, null, null);

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-lf-text md:text-3xl">
            Dashboard
          </h1>
          <p className="mt-1 max-w-xl text-sm leading-relaxed text-lf-muted">
            All-time snapshot · {analystsList.length} analyst
            {analystsList.length === 1 ? "" : "s"} · {teamCount} sales team
            {teamCount === 1 ? "" : "s"}. Use{" "}
            <Link
              href="/analyst-team-lead/reports"
              className="font-medium text-lf-link hover:underline"
            >
              Report
            </Link>{" "}
            for a date range and exports.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Link
            href="/analyst-team-lead/reports"
            className="rounded-lg border border-lf-border bg-lf-surface px-4 py-2.5 text-sm font-semibold text-lf-text shadow-sm hover:bg-lf-bg/50"
          >
            Report
          </Link>
          <Link
            href="/analyst-team-lead/team"
            className="rounded-lg bg-lf-accent px-4 py-2.5 text-sm font-semibold text-lf-on-accent shadow-lg shadow-[#c62828]/30 hover:bg-lf-accent-hover"
          >
            Members
          </Link>
        </div>
      </header>

      <UnifiedPortalReportSections
        vm={vm}
        countrySubtitle="Phone country (E.164) for your analysts' leads (all time). Each row splits qualified, not qualified, and irrelevant. Sorted by total leads; the list shows the top 10 countries by default when there are more."
        leadsHref={hrefWithDateRange("/analyst-team-lead/leads", null, null)}
        recentLeadsTitle="Recent team leads"
      />
    </div>
  );
}
