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
import { execLeadWhere } from "@/lib/exec-leads";
import { UserRole } from "@/lib/constants";
import { buildUnifiedDashboardViewModel } from "@/lib/unified-dashboard-report";

export default async function ExecutiveDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const session = await getSession();
  if (!session) return null;

  const { from, to } = await analystRangeParams(searchParams);
  const rangeLabel = analystRangeSummaryLabel(from, to);
  const where = execLeadWhere(session.id, from, to);

  const leads = await prisma.lead.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
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
    assignedRepName: session.name,
  }));

  const vm = buildUnifiedDashboardViewModel(unifiedRows, {
    kind: "sales_executive",
    rangeLabel,
    generatedAt,
    fileNamePrefix: "leadflow-dashboard",
    reportTitle: "LeadFlow dashboard report",
    reportSubtitle: `Sales executive · ${session.name} · ${team?.name ?? "—"}`,
    analystName: session.name,
    analystEmail: session.email,
    teamName: team?.name ?? "—",
    execCount,
  });

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-lf-text md:text-3xl">
            Dashboard
          </h1>
          <p className="mt-1 max-w-xl text-sm leading-relaxed text-lf-muted">
            Same report layout and export as every portal · Sales team{" "}
            <span className="text-lf-text-secondary">{team?.name ?? "—"}</span>
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <DashboardReportExport payload={vm.exportPayload} />
          <Link
            href={hrefWithDateRange("/executive/leads", from, to)}
            className="text-sm font-medium text-lf-link hover:text-lf-link-bright"
          >
            View all leads →
          </Link>
        </div>
      </header>

      <AnalystDateRangeBarSuspense />

      <UnifiedPortalReportSections
        vm={vm}
        countrySubtitle="Phone country (E.164) for leads assigned to you in this range. Each row splits qualified, not qualified, and irrelevant. Sorted by total leads; the list shows the top 10 countries by default when there are more."
        leadsHref={hrefWithDateRange("/executive/leads", from, to)}
        recentLeadsTitle="Recent leads"
      />
    </div>
  );
}
