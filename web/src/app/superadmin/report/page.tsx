import type { Metadata } from "next";
import { SuperadminReportCharts } from "@/components/superadmin/superadmin-report-charts";
import { SuperadminReportExport } from "@/components/superadmin/superadmin-report-export";
import { SuperadminReportHistograms } from "@/components/superadmin/superadmin-report-histograms";
import { UnifiedPortalReportSections } from "@/components/reports/unified-portal-report-sections";
import { getSuperadminReportAggregates } from "@/lib/superadmin-stats";
import { buildUnifiedDashboardViewModel } from "@/lib/unified-dashboard-report";

export const metadata: Metadata = {
  title: "Report · Superadmin",
};

function RatioCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-lf-surface/90 px-4 py-4">
      <p className="text-xs font-medium uppercase tracking-wide text-lf-subtle">
        {label}
      </p>
      <p className="mt-2 text-xl font-semibold tabular-nums text-white">
        {value}
      </p>
      {sub ? <p className="mt-1 text-xs text-lf-subtle">{sub}</p> : null}
    </div>
  );
}

export default async function SuperadminReportPage() {
  const r = await getSuperadminReportAggregates();
  const generatedAt = new Date().toISOString();

  const unifiedRows = r.leads.map((l) => ({
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
    kind: "superadmin",
    rangeLabel: "All time",
    generatedAt,
    fileNamePrefix: "leadflow-dashboard",
    reportTitle: "LeadFlow dashboard report",
    reportSubtitle: "Organization-wide · Superadmin",
    analystName: "Superadmin",
    analystEmail: "—",
    analystCount: undefined,
    teamCount: undefined,
  });

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">
            Report
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-lf-muted">
            Same dashboard sections and export format (CSV / Excel / PDF) as
            analyst, team lead, and executive portals. Histograms and ratio cards
            below add organization-wide views.
          </p>
        </div>
        <SuperadminReportExport payload={vm.exportPayload} />
      </div>

      <SuperadminReportCharts
        totalLeads={r.total}
        qualified={r.qualified}
        notQualified={r.notQualified}
        irrelevant={r.irrelevant}
        closedWon={r.closedWon}
        closedLost={r.closedLost}
      />

      <SuperadminReportHistograms
        scoreHistogram={r.scoreHistogram}
        createdByMonth={r.createdByMonth}
        countryHistogram={r.countryHistogram}
      />

      <div>
        <h2 className="text-sm font-semibold text-lf-text-secondary">Ratios</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <RatioCard
            label="Conversion (won / all leads)"
            value={`${r.conversionRatio.toFixed(1)}%`}
            sub={`${r.closedWon} won of ${r.total} leads`}
          />
          <RatioCard
            label="Win rate (won / closed)"
            value={
              r.closedWon + r.closedLost > 0
                ? `${r.winRateAmongClosed.toFixed(1)}%`
                : "—"
            }
            sub="Among closed won + lost only"
          />
          <RatioCard
            label="Qualified ratio"
            value={`${r.qualifiedRatio.toFixed(1)}%`}
            sub={`${r.qualified} of ${r.total}`}
          />
          <RatioCard
            label="Not qualified ratio"
            value={`${r.notQualifiedRatio.toFixed(1)}%`}
            sub={`${r.notQualified} of ${r.total}`}
          />
          <RatioCard
            label="Irrelevant ratio"
            value={`${r.irrelevantRatio.toFixed(1)}%`}
            sub={`${r.irrelevant} of ${r.total}`}
          />
          <RatioCard
            label="Lost (closed lost / all leads)"
            value={`${r.lostRatioOfAll.toFixed(1)}%`}
            sub={`${r.closedLost} lost of ${r.total}`}
          />
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-lf-bg/90 p-6">
        <h2 className="text-sm font-semibold text-lf-text-secondary">
          Unified portal dashboard (same as other roles)
        </h2>
        <p className="mt-1 text-xs text-lf-subtle">
          All-time data · matches the analyst / team lead / executive dashboard
          layout and export tables.
        </p>
        <div className="mt-6 space-y-8">
          <UnifiedPortalReportSections
            vm={vm}
            countrySubtitle="Phone country (E.164) for all leads. Each row splits qualified, not qualified, and irrelevant."
            leadsHref="/superadmin/leads"
            recentLeadsTitle="Recent leads (org-wide)"
          />
        </div>
      </div>
    </div>
  );
}
