import type { DashboardExportPayload } from "@/lib/dashboard-export-types";
import { buildAnalystAnalyticsReportPayload } from "@/lib/analyst-analytics-payload";
import {
  buildAnalystCityRows,
  buildCountryQualRows,
  type CountryQualRow,
} from "@/lib/leads-by-country-qual";
import {
  formatAnalystDate,
  pipelineNoteForLead,
  pipelinePillForLead,
  sourcePillText,
} from "@/lib/analyst-ui";
import { analystFacingSalesLabel } from "@/lib/sales-stage-labels";
import { QualificationStatus, SalesStage } from "@/lib/constants";

export type UnifiedPortalKind =
  | "lead_analyst"
  | "analyst_team_lead"
  | "main_team_lead"
  | "sales_executive"
  | "superadmin";

/** Normalized lead row for reports (map each portal’s Prisma shape to this). */
export type UnifiedLeadRow = {
  id: string;
  leadName: string | null;
  source: string;
  qualificationStatus: string;
  salesStage: string;
  leadScore: number | null;
  phone: string | null;
  country: string | null;
  city: string | null;
  createdAt: Date;
  notes: string | null;
  createdByName: string;
  assignedRepName: string | null;
};

export type UnifiedPortalMeta = {
  kind: UnifiedPortalKind;
  rangeLabel: string;
  generatedAt: string;
  fileNamePrefix: string;
  reportTitle: string;
  reportSubtitle: string;
  analystName?: string;
  analystEmail?: string;
  analystCount?: number;
  teamCount?: number;
  teamName?: string;
  execCount?: number;
};

const STAGE_ORDER = [
  SalesStage.PRE_SALES,
  SalesStage.WITH_TEAM_LEAD,
  SalesStage.WITH_EXECUTIVE,
  SalesStage.CLOSED_WON,
  SalesStage.CLOSED_LOST,
] as const;

export type UnifiedDashboardViewModel = {
  meta: UnifiedPortalMeta;
  exportPayload: DashboardExportPayload;
  total: number;
  qualified: number;
  notQ: number;
  irrelevant: number;
  qualRate: number;
  closedWon: number;
  closedLost: number;
  routed: number;
  withExec: number;
  beyondPreSalesQualified: number;
  sourceEntries: [string, number][];
  maxSource: number;
  countryRows: CountryQualRow[];
  cityRows: ReturnType<typeof buildAnalystCityRows>;
  stageEntries: { stageKey: string; label: string; count: number }[];
  maxStageBar: number;
  qualInsightRows: {
    label: string;
    count: number;
    pct: number;
    barClass: string;
  }[];
  maxQualBar: number;
  scoreBuckets: { label: string; count: number }[];
  pipelineInProgress: number;
  atlPassed: {
    qualifiedPassed: number;
    qualifiedInternal: number;
    passedPct: number;
    passedWithTl: number;
    passedWithExec: number;
    passedWon: number;
    passedLost: number;
  } | null;
  recent: UnifiedLeadRow[];
  pipelineQualified: UnifiedLeadRow[];
  /** All leads in scope (for full snapshot table). */
  allLeads: UnifiedLeadRow[];
};

function leadForAnalytics(l: UnifiedLeadRow) {
  return {
    source: l.source,
    qualificationStatus: l.qualificationStatus,
    salesStage: l.salesStage,
    leadScore: l.leadScore,
    phone: l.phone,
    country: l.country,
    city: l.city,
  };
}

export function buildUnifiedDashboardViewModel(
  leads: UnifiedLeadRow[],
  meta: UnifiedPortalMeta,
): UnifiedDashboardViewModel {
  const total = leads.length;
  const qualified = leads.filter(
    (l) => l.qualificationStatus === QualificationStatus.QUALIFIED,
  ).length;
  const notQ = leads.filter(
    (l) => l.qualificationStatus === QualificationStatus.NOT_QUALIFIED,
  ).length;
  const irrelevant = leads.filter(
    (l) => l.qualificationStatus === QualificationStatus.IRRELEVANT,
  ).length;
  const qualRate = total ? Math.round((qualified / total) * 100) : 0;

  const closedWon = leads.filter(
    (l) => l.salesStage === SalesStage.CLOSED_WON,
  ).length;
  const closedLost = leads.filter(
    (l) => l.salesStage === SalesStage.CLOSED_LOST,
  ).length;
  const withExec = leads.filter(
    (l) => l.salesStage === SalesStage.WITH_EXECUTIVE,
  ).length;
  const routed = leads.filter(
    (l) =>
      l.salesStage === SalesStage.WITH_TEAM_LEAD ||
      l.salesStage === SalesStage.WITH_EXECUTIVE ||
      l.salesStage === SalesStage.CLOSED_WON ||
      l.salesStage === SalesStage.CLOSED_LOST,
  ).length;

  const qualifiedPassed = leads.filter(
    (l) =>
      l.qualificationStatus === QualificationStatus.QUALIFIED &&
      l.salesStage !== SalesStage.PRE_SALES,
  );
  const qualifiedInternal = leads.filter(
    (l) =>
      l.qualificationStatus === QualificationStatus.QUALIFIED &&
      l.salesStage === SalesStage.PRE_SALES,
  );
  const beyondPreSalesQualified = qualifiedPassed.length;

  const passedPct = qualified
    ? Math.round((qualifiedPassed.length / qualified) * 100)
    : 0;
  const passedWithTl = qualifiedPassed.filter(
    (l) => l.salesStage === SalesStage.WITH_TEAM_LEAD,
  ).length;
  const passedWithExec = qualifiedPassed.filter(
    (l) => l.salesStage === SalesStage.WITH_EXECUTIVE,
  ).length;
  const passedWon = qualifiedPassed.filter(
    (l) => l.salesStage === SalesStage.CLOSED_WON,
  ).length;
  const passedLost = qualifiedPassed.filter(
    (l) => l.salesStage === SalesStage.CLOSED_LOST,
  ).length;

  const bySource = new Map<string, number>();
  for (const l of leads) {
    const key = l.source || "—";
    bySource.set(key, (bySource.get(key) ?? 0) + 1);
  }
  const sourceEntries = [...bySource.entries()].sort((a, b) => b[1] - a[1]);
  const maxSource = sourceEntries[0]?.[1] ?? 1;

  const countryRows = buildCountryQualRows(leads);
  const cityRows = buildAnalystCityRows(leads);

  const byStageCount = new Map<string, number>();
  for (const st of STAGE_ORDER) byStageCount.set(st, 0);
  for (const l of leads) {
    byStageCount.set(
      l.salesStage,
      (byStageCount.get(l.salesStage) ?? 0) + 1,
    );
  }
  const stageEntries = STAGE_ORDER.map((st) => ({
    stageKey: st,
    label: analystFacingSalesLabel(st),
    count: byStageCount.get(st) ?? 0,
  }));
  const maxStageBar = Math.max(...stageEntries.map((s) => s.count), 1);

  const qualInsightRows = (
    [
      ["Qualified", qualified, "bg-lf-success"],
      ["Not qualified", notQ, "bg-lf-warning"],
      ["Irrelevant", irrelevant, "bg-lf-subtle"],
    ] as const
  ).map(([label, count, barClass]) => ({
    label,
    count,
    barClass,
    pct: total ? Math.round((count / total) * 100) : 0,
  }));
  const maxQualBar = Math.max(qualified, notQ, irrelevant, 1);

  const analytics = buildAnalystAnalyticsReportPayload(
    leads.map(leadForAnalytics),
    {
      rangeLabel: meta.rangeLabel,
      analystName: meta.analystName ?? "—",
      analystEmail: meta.analystEmail ?? "—",
      title: meta.reportTitle,
      subtitle: meta.reportSubtitle,
    },
  );

  const scoreBuckets = analytics.scoreBuckets;

  const pipelineQualified = leads.filter(
    (l) => l.qualificationStatus === QualificationStatus.QUALIFIED,
  );
  const recent = leads.slice(0, 6);

  const exportPayload = buildUnifiedExportPayload(
    leads,
    meta,
    analytics,
    {
      total,
      qualified,
      notQ,
      irrelevant,
      qualRate,
      closedWon,
      closedLost,
      inProgress: leads.filter(
        (l) => l.salesStage === SalesStage.WITH_EXECUTIVE,
      ).length,
      assigned: leads.filter(
        (l) => l.salesStage === SalesStage.WITH_TEAM_LEAD,
      ).length,
      routed,
      withExec,
      qualifiedPassed: qualifiedPassed.length,
      qualifiedInternal: qualifiedInternal.length,
      passedPct,
      passedWithTl,
      passedWithExec,
      passedWon,
      passedLost,
    },
    countryRows,
    cityRows,
    stageEntries,
    qualInsightRows,
    sourceEntries,
  );

  const showQualifiedPassedBlock =
    meta.kind === "analyst_team_lead" || meta.kind === "superadmin";
  const atlPassed = showQualifiedPassedBlock
    ? {
        qualifiedPassed: qualifiedPassed.length,
        qualifiedInternal: qualifiedInternal.length,
        passedPct,
        passedWithTl,
        passedWithExec,
        passedWon,
        passedLost,
      }
    : null;

  return {
    meta,
    exportPayload,
    total,
    qualified,
    notQ,
    irrelevant,
    qualRate,
    closedWon,
    closedLost,
    routed,
    withExec,
    beyondPreSalesQualified,
    sourceEntries,
    maxSource,
    countryRows,
    cityRows,
    stageEntries,
    maxStageBar,
    qualInsightRows,
    maxQualBar,
    scoreBuckets,
    atlPassed,
    recent,
    pipelineQualified,
    allLeads: leads,
    pipelineInProgress: analytics.pipeline.inProgress,
  };
}

function buildUnifiedExportPayload(
  leads: UnifiedLeadRow[],
  meta: UnifiedPortalMeta,
  analytics: ReturnType<typeof buildAnalystAnalyticsReportPayload>,
  metrics: {
    total: number;
    qualified: number;
    notQ: number;
    irrelevant: number;
    qualRate: number;
    closedWon: number;
    closedLost: number;
    inProgress: number;
    assigned: number;
    routed: number;
    withExec: number;
    qualifiedPassed: number;
    qualifiedInternal: number;
    passedPct: number;
    passedWithTl: number;
    passedWithExec: number;
    passedWon: number;
    passedLost: number;
  },
  countryRows: CountryQualRow[],
  cityRows: ReturnType<typeof buildAnalystCityRows>,
  stageEntries: { stageKey: string; label: string; count: number }[],
  qualInsightRows: { label: string; count: number; pct: number }[],
  sourceEntries: [string, number][],
): DashboardExportPayload {
  const summaryRows: { label: string; value: string | number }[] = [
    { label: "Portal", value: meta.kind.replace(/_/g, " ") },
    { label: "Scope", value: meta.reportSubtitle },
    { label: "Total leads", value: metrics.total },
    {
      label: "Qualification rate %",
      value: metrics.qualRate.toFixed(1),
    },
    { label: "Qualified", value: metrics.qualified },
    { label: "Not qualified", value: metrics.notQ },
    { label: "Irrelevant", value: metrics.irrelevant },
    {
      label: "Avg lead score",
      value: analytics.kpis.avgLeadScore ?? "—",
    },
    {
      label: "Closed won rate % (won / all leads)",
      value: analytics.kpis.closedWonRatePct.toFixed(1),
    },
    { label: "Routed (beyond pre-sales)", value: metrics.routed },
    { label: "With team lead", value: metrics.assigned },
    { label: "With executive", value: metrics.withExec },
    { label: "Closed won", value: metrics.closedWon },
    { label: "Closed lost", value: metrics.closedLost },
    { label: "Qualified → beyond pre-sales", value: metrics.qualifiedPassed },
    { label: "Qualified → still pre-sales", value: metrics.qualifiedInternal },
    {
      label: "Qualified passed %",
      value: metrics.qualified ? metrics.passedPct.toFixed(1) : "—",
    },
    {
      label: "Passed → with team lead",
      value: metrics.passedWithTl,
    },
    {
      label: "Passed → with executive",
      value: metrics.passedWithExec,
    },
    { label: "Passed → closed won", value: metrics.passedWon },
    { label: "Passed → closed lost", value: metrics.passedLost },
  ];

  if (meta.analystCount != null) {
    summaryRows.push({ label: "Analysts (ATL)", value: meta.analystCount });
  }
  if (meta.teamCount != null) {
    summaryRows.push({ label: "Sales teams (ATL)", value: meta.teamCount });
  }
  if (meta.teamName) {
    summaryRows.push({ label: "Team", value: meta.teamName });
  }
  if (meta.execCount != null) {
    summaryRows.push({
      label: "Sales executives (team)",
      value: meta.execCount,
    });
  }

  const tables: DashboardExportPayload["tables"] = [
    {
      title: "By source",
      headers: ["Source", "Count"],
      rows: sourceEntries.map(([label, count]) => [
        sourcePillText(label),
        count,
      ]),
    },
    {
      title: "By country (qualification)",
      headers: ["Country", "Qualified", "Not Q", "Irrelevant", "Total"],
      rows: countryRows.map((r) => [r.label, r.q, r.nq, r.ir, r.total]),
    },
    {
      title: "By city (optional · with country)",
      headers: ["City · country", "Count"],
      rows: cityRows.map((r) => [r.label, r.count]),
    },
    {
      title: "Pipeline summary",
      headers: ["Assigned", "In progress", "Closed won", "Closed lost"],
      rows: [
        [
          metrics.assigned,
          metrics.inProgress,
          metrics.closedWon,
          metrics.closedLost,
        ],
      ],
    },
    {
      title: "Score buckets",
      headers: ["Bucket", "Count"],
      rows: analytics.scoreBuckets.map((r) => [r.label, r.count]),
    },
    {
      title: "By stage",
      headers: ["Stage", "Count"],
      rows: stageEntries.map((s) => [s.label, s.count]),
    },
    {
      title: "Qualification insight",
      headers: ["Segment", "Count", "%"],
      rows: qualInsightRows.map((r) => [
        r.label,
        r.count,
        r.pct.toFixed(1),
      ]),
    },
    {
      title: "Lead snapshot",
      headers: ["Lead", "Created by", "Source", "Stage", "Assigned rep"],
      rows: leads.map((l) => [
        l.leadName ?? "—",
        l.createdByName,
        sourcePillText(l.source),
        analystFacingSalesLabel(l.salesStage),
        l.assignedRepName ?? "—",
      ]),
    },
    {
      title: "Qualified pipeline detail",
      headers: ["Lead", "Created by", "Qualified on", "Pipeline", "Note"],
      rows: leads
        .filter(
          (l) =>
            l.qualificationStatus === QualificationStatus.QUALIFIED,
        )
        .map((l) => {
          const pill = pipelinePillForLead(
            l.qualificationStatus,
            l.salesStage,
          );
          return [
            l.leadName ?? "—",
            l.createdByName,
            formatAnalystDate(l.createdAt),
            pill.label,
            pipelineNoteForLead(
              l.qualificationStatus,
              l.salesStage,
              l.notes,
            ),
          ];
        }),
    },
  ];

  return {
    title: meta.reportTitle,
    subtitle: meta.reportSubtitle,
    rangeLabel: meta.rangeLabel,
    generatedAt: meta.generatedAt,
    fileNamePrefix: meta.fileNamePrefix,
    summaryRows,
    tables,
  };
}
