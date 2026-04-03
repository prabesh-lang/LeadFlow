import Link from "next/link";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { AnalystHeaderAddButton } from "@/components/analyst/add-lead-modal";
import AnalystDateRangeBarSuspense from "@/components/analyst/analyst-date-range-bar-suspense";
import { UnifiedPortalReportSections } from "@/components/reports/unified-portal-report-sections";
import { DashboardReportExport } from "@/components/dashboard-report-export";
import {
  analystRangeParams,
  analystRangeSummaryLabel,
  hrefWithDateRange,
  leadWhereWithDateRange,
} from "@/lib/analyst-date-range";
import { buildUnifiedDashboardViewModel } from "@/lib/unified-dashboard-report";

export default async function AnalystDashboard({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const session = await getSession();
  if (!session) return null;

  const { from, to } = await analystRangeParams(searchParams);
  const rangeLabel = analystRangeSummaryLabel(from, to);

  const leads = await prisma.lead.findMany({
    where: leadWhereWithDateRange(session.id, from, to),
    orderBy: { createdAt: "desc" },
    include: {
      assignedSalesExec: { select: { name: true } },
    },
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
    createdById: session.id,
    createdByEmail: session.email,
    createdByName: session.name,
    assignedSalesExecId: l.assignedSalesExecId,
    assignedRepName: l.assignedSalesExec?.name ?? null,
  }));

  const vm = buildUnifiedDashboardViewModel(unifiedRows, {
    kind: "lead_analyst",
    rangeLabel,
    generatedAt,
    fileNamePrefix: "leadflow-dashboard",
    reportTitle: "LeadFlow dashboard report",
    reportSubtitle: `${session.name} · ${session.email}`,
    analystName: session.name,
    analystEmail: session.email,
  });

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-lf-text md:text-3xl">
            Dashboard
          </h1>
          <p className="mt-1 max-w-xl text-sm leading-relaxed text-lf-muted">
            Same report layout and export format as every portal. Use{" "}
            <Link
              href={hrefWithDateRange("/analyst/leads", from, to)}
              className="text-lf-link hover:underline"
            >
              All leads
            </Link>{" "}
            for the full sortable table.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <DashboardReportExport payload={vm.exportPayload} />
          <AnalystHeaderAddButton />
        </div>
      </header>

      <AnalystDateRangeBarSuspense />

      <UnifiedPortalReportSections
        vm={vm}
        countrySubtitle="Phone country (E.164) for your leads in this range. Each row splits qualified, not qualified, and irrelevant. Sorted by total leads; the list shows the top 10 countries by default when there are more."
        leadsHref={hrefWithDateRange("/analyst/leads", from, to)}
        recentLeadsTitle="Recently added leads"
      />
    </div>
  );
}
