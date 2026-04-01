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
import { mtlLeadWhere } from "@/lib/mtl-leads";
import { UserRole } from "@/lib/constants";
import { buildUnifiedDashboardViewModel } from "@/lib/unified-dashboard-report";

export default async function MainTeamLeadDashboard({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const session = await getSession();
  if (!session) return null;

  const { from, to } = await analystRangeParams(searchParams);
  const rangeLabel = analystRangeSummaryLabel(from, to);
  const where = mtlLeadWhere(session.id, from, to);

  const leads = await prisma.lead.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      createdBy: { select: { name: true } },
      assignedSalesExec: { select: { name: true } },
    },
  });

  const team = session.teamId
    ? await prisma.team.findUnique({
        where: { id: session.teamId },
        select: { name: true },
      })
    : null;

  const execCount =
    session.teamId == null
      ? 0
      : await prisma.user.count({
          where: { teamId: session.teamId, role: UserRole.SALES_EXECUTIVE },
        });

  const generatedAt = new Date().toISOString();
  const unifiedRows = leads.map((l) => ({
    id: l.id,
    leadName: l.leadName,
    source: l.source,
    qualificationStatus: l.qualificationStatus,
    salesStage: l.salesStage,
    leadScore: l.leadScore,
    phone: l.phone,
    country: l.country,
    city: l.city,
    createdAt: l.createdAt,
    notes: l.notes,
    createdByName: l.createdBy.name,
    assignedRepName: l.assignedSalesExec?.name ?? null,
  }));

  const vm = buildUnifiedDashboardViewModel(unifiedRows, {
    kind: "main_team_lead",
    rangeLabel,
    generatedAt,
    fileNamePrefix: "leadflow-dashboard",
    reportTitle: "LeadFlow dashboard report",
    reportSubtitle: `MTL · ${team?.name ?? "—"}`,
    analystName: session.name,
    analystEmail: session.email,
    teamName: team?.name ?? "—",
    execCount,
  });

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-white md:text-3xl">
            Dashboard
          </h1>
          <p className="mt-1 max-w-xl text-sm leading-relaxed text-lf-muted">
            Same report layout and export as every portal · Team{" "}
            <span className="text-lf-text-secondary">{team?.name ?? "—"}</span>
            {execCount > 0
              ? ` · ${execCount} sales executive${execCount === 1 ? "" : "s"}`
              : ""}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <DashboardReportExport payload={vm.exportPayload} />
          <Link
            href="/team-lead/team"
            className="text-sm font-medium text-lf-link hover:text-lf-link-bright"
          >
            View team →
          </Link>
        </div>
      </header>

      <AnalystDateRangeBarSuspense />

      <UnifiedPortalReportSections
        vm={vm}
        countrySubtitle="Phone country (E.164) for leads routed to your team in this range. Each row splits qualified, not qualified, and irrelevant. Sorted by total leads; the list shows the top 10 countries by default when there are more."
        leadsHref={hrefWithDateRange("/team-lead/leads", from, to)}
        recentLeadsTitle="Recent leads"
      />
    </div>
  );
}
