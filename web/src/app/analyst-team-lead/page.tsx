import Link from "next/link";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import AnalystDateRangeBarSuspense from "@/components/analyst/analyst-date-range-bar-suspense";
import { UnifiedPortalReportSections } from "@/components/reports/unified-portal-report-sections";
import { DashboardReportExport } from "@/components/dashboard-report-export";
import {
  analystRangeParams,
  analystRangeSummaryLabel,
  hrefWithDateRange,
} from "@/lib/analyst-date-range";
import { atlLeadWhere } from "@/lib/atl-leads";
import { UserRole } from "@/lib/constants";
import { buildUnifiedDashboardViewModel } from "@/lib/unified-dashboard-report";

export default async function AnalystTeamLeadDashboard({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const session = await getSession();
  if (!session) return null;

  const { from, to } = await analystRangeParams(searchParams);
  const rangeLabel = analystRangeSummaryLabel(from, to);

  const analystsList = await prisma.user.findMany({
    where: { managerId: session.id, role: UserRole.LEAD_ANALYST },
    orderBy: { name: "asc" },
  });
  const analystIds = analystsList.map((a) => a.id);

  const leads =
    analystIds.length === 0
      ? []
      : await prisma.lead.findMany({
          where: atlLeadWhere(analystIds, from, to),
          orderBy: { createdAt: "desc" },
          include: {
            createdBy: { select: { id: true, name: true, email: true } },
            assignedSalesExec: { select: { id: true, name: true } },
          },
        });

  const teamCount = await prisma.team.count();
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
    createdById: l.createdBy.id,
    createdByEmail: l.createdBy.email,
    createdByName: l.createdBy.name,
    assignedSalesExecId: l.assignedSalesExecId,
    assignedRepName: l.assignedSalesExec?.name ?? null,
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

      <AnalystDateRangeBarSuspense />

      <UnifiedPortalReportSections
        vm={vm}
        countrySubtitle="Phone country (E.164) for your analysts' leads in this range. Each row splits qualified, not qualified, and irrelevant. Sorted by total leads; the list shows the top 10 countries by default when there are more."
        leadsHref={hrefWithDateRange("/analyst-team-lead/leads", from, to)}
        recentLeadsTitle="Recent team leads"
      />
    </div>
  );
}
