import Link from "next/link";
import { LeadsByCityReportCard } from "@/components/leads-by-city-report-card";
import { LeadsByCountryQualCard } from "@/components/leads-by-country-qual-card";
import {
  formatAnalystDate,
  pipelineNoteForLead,
  pipelinePillForLead,
  sourcePillText,
} from "@/lib/analyst-ui";
import type { UnifiedDashboardViewModel } from "@/lib/unified-dashboard-report";
function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-slate-100 bg-lf-surface p-5 shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}

const STAT_TOP: Record<"a" | "b" | "c" | "d", string> = {
  a: "border-t-lf-accent",
  b: "border-t-lf-link",
  c: "border-t-lf-accent",
  d: "border-t-lf-link",
};

function StatCard({
  slot,
  title,
  value,
  sub,
}: {
  slot: keyof typeof STAT_TOP;
  title: string;
  value: string | number;
  sub: string;
}) {
  const border = STAT_TOP[slot];
  return (
    <Card className={`border-t-4 ${border}`}>
      <p className="text-xs font-medium uppercase tracking-wide text-lf-subtle">
        {title}
      </p>
      <p className="mt-2 text-3xl font-bold tabular-nums text-lf-text">{value}</p>
      <p className="mt-1 text-xs text-lf-muted">{sub}</p>
    </Card>
  );
}

export function UnifiedPortalReportSections({
  vm,
  countrySubtitle,
  leadsHref,
  recentLeadsTitle = "Recent leads",
}: {
  vm: UnifiedDashboardViewModel;
  countrySubtitle: string;
  leadsHref: string;
  recentLeadsTitle?: string;
}) {
  const {
    meta,
    total,
    qualified,
    qualRate,
    closedWon,
    closedLost,
    beyondPreSalesQualified,
    pipelineInProgress,
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
    allLeads,
  } = vm;

  return (
    <>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          slot="a"
          title="Total leads"
          value={total}
          sub={meta.rangeLabel === "All time" ? "In scope" : meta.rangeLabel}
        />
        <StatCard
          slot="b"
          title="Qualified"
          value={qualified}
          sub={`${qualRate}% of leads in range`}
        />
        <StatCard
          slot="c"
          title="Beyond pre-sales (qualified)"
          value={beyondPreSalesQualified}
          sub="Handed to sales or further"
        />
        <StatCard
          slot="d"
          title="Closed won"
          value={closedWon}
          sub={`${closedLost} lost · ${pipelineInProgress} with rep`}
        />
      </section>

      <Card>
        <h2 className="text-base font-semibold text-lf-text">Insights</h2>
        <p className="mt-1 text-sm text-lf-muted">
          Qualification and routing for leads in this period
        </p>
        <div className="mt-6 grid gap-8 lg:grid-cols-2">
          <div>
            <h3 className="text-sm font-semibold text-lf-text-secondary">
              By lead status
            </h3>
            <p className="mt-1 text-xs text-lf-subtle">
              Qualification outcome for leads in range
            </p>
            <ul className="mt-4 space-y-4">
              {total === 0 ? (
                <li className="text-sm text-lf-subtle">No leads in range.</li>
              ) : (
                qualInsightRows.map(({ label, count, barClass, pct }) => (
                  <li key={label}>
                    <div className="mb-1 flex justify-between text-xs text-lf-muted">
                      <span className="font-medium text-lf-text-secondary">
                        {label}
                      </span>
                      <span className="tabular-nums text-lf-text">
                        {count}{" "}
                        <span className="text-lf-subtle">({pct}%)</span>
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-lf-bg">
                      <div
                        className={`h-full rounded-full ${barClass}`}
                        style={{
                          width: `${Math.max(4, (count / maxQualBar) * 100)}%`,
                        }}
                      />
                    </div>
                  </li>
                ))
              )}
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-lf-text-secondary">
              By sales stage
            </h3>
            <p className="mt-1 text-xs text-lf-subtle">
              Where leads sit in the funnel (all leads in range)
            </p>
            <ul className="mt-4 space-y-4">
              {total === 0 ? (
                <li className="text-sm text-lf-subtle">No leads in range.</li>
              ) : (
                stageEntries.map(({ stageKey, label, count }) => (
                  <li key={stageKey}>
                    <div className="mb-1 flex justify-between text-xs text-lf-muted">
                      <span className="font-medium text-lf-text-secondary">
                        {label}
                      </span>
                      <span className="tabular-nums text-lf-text">{count}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-lf-bg">
                      <div
                        className="h-full rounded-full bg-lf-link"
                        style={{
                          width: `${Math.max(
                            4,
                            (count / maxStageBar) * 100,
                          )}%`,
                        }}
                      />
                    </div>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      </Card>

      {atlPassed ? (
        <Card>
          <h2 className="text-base font-semibold text-lf-text">
            Qualified leads passed to sales
          </h2>
          <p className="mt-1 text-sm text-lf-muted">
            Qualified leads that have left internal routing (handed to a main
            team onward)
          </p>
          <div className="mt-6 flex flex-wrap items-end gap-6 border-b border-slate-100 pb-6">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-lf-subtle">
                Passed
              </p>
              <p className="mt-1 text-4xl font-bold tabular-nums text-lf-text">
                {atlPassed.qualifiedPassed}
              </p>
              <p className="mt-1 text-xs text-lf-subtle">
                {qualified > 0
                  ? `${atlPassed.passedPct}% of qualified in range`
                  : "No qualified leads in range"}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-lf-subtle">
                Still internal (qualified)
              </p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-lf-muted">
                {atlPassed.qualifiedInternal}
              </p>
              <p className="mt-1 text-xs text-lf-subtle">
                Awaiting routing to a main team
              </p>
            </div>
          </div>
          {atlPassed.qualifiedPassed > 0 ? (
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {(
                [
                  ["With main team (no rep yet)", atlPassed.passedWithTl],
                  ["With sales executive", atlPassed.passedWithExec],
                  ["Closed — won", atlPassed.passedWon],
                  ["Closed — lost", atlPassed.passedLost],
                ] as const
              ).map(([label, val]) => (
                <div
                  key={label}
                  className="rounded-xl border border-slate-100 bg-lf-bg px-4 py-3"
                >
                  <p className="text-xs text-lf-subtle">{label}</p>
                  <p className="mt-1 text-xl font-bold tabular-nums text-lf-text">
                    {val}
                  </p>
                </div>
              ))}
            </div>
          ) : null}
        </Card>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h2 className="text-base font-semibold text-lf-text">
              {recentLeadsTitle}
            </h2>
            <Link
              href={leadsHref}
              className="text-sm font-medium text-lf-link hover:text-lf-link"
            >
              View all
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-semibold uppercase tracking-wider text-lf-subtle">
                  <th className="pb-3 pr-4 font-medium">Lead</th>
                  <th className="pb-3 pr-4 font-medium">Creator</th>
                  <th className="pb-3 pr-4 font-medium">Source</th>
                  <th className="pb-3 font-medium">Stage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recent.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="py-8 text-center text-lf-subtle"
                    >
                      No leads in this range.
                    </td>
                  </tr>
                ) : (
                  recent.map((l) => (
                    <tr key={l.id} className="text-lf-muted">
                      <td className="py-3 pr-4 font-semibold text-lf-text">
                        {l.leadName || "—"}
                      </td>
                      <td className="py-3 pr-4 text-lf-text-secondary">
                        {l.createdByName}
                      </td>
                      <td className="py-3 pr-4">
                        <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-lf-text-secondary">
                          {sourcePillText(l.source)}
                        </span>
                      </td>
                      <td className="py-3 text-xs text-lf-muted">
                        {pipelinePillForLead(
                          l.qualificationStatus,
                          l.salesStage,
                        ).label}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <h2 className="mb-4 text-base font-semibold text-lf-text">
            Leads by source
          </h2>
          <ul className="space-y-4">
            {sourceEntries.length === 0 ? (
              <li className="text-sm text-lf-subtle">No data yet.</li>
            ) : (
              sourceEntries.slice(0, 8).map(([label, count]) => (
                <li key={label}>
                  <div className="mb-1 flex justify-between text-xs text-lf-muted">
                    <span className="truncate pr-2 font-medium text-lf-text-secondary">
                      {sourcePillText(label)}
                    </span>
                    <span className="shrink-0 tabular-nums text-lf-text">
                      {count}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-lf-bg">
                    <div
                      className="h-full rounded-full bg-lf-accent"
                      style={{
                        width: `${Math.max(8, (count / maxSource) * 100)}%`,
                      }}
                    />
                  </div>
                </li>
              ))
            )}
          </ul>
        </Card>
      </div>

      <LeadsByCountryQualCard rows={countryRows} subtitle={countrySubtitle} />

      <LeadsByCityReportCard rows={cityRows} />

      {scoreBuckets.length > 0 ? (
        <Card>
          <h2 className="mb-4 text-base font-semibold text-lf-text">
            Lead score distribution
          </h2>
          <ul className="space-y-3">
            {scoreBuckets.map(({ label, count }) => (
              <li
                key={label}
                className="flex justify-between text-sm text-lf-muted"
              >
                <span className="text-lf-text-secondary">{label}</span>
                <span className="tabular-nums text-lf-text">{count}</span>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      <Card>
        <h2 className="mb-4 text-base font-semibold text-lf-text">
          Qualified pipeline detail
        </h2>
        <p className="mt-1 text-sm text-lf-muted">
          All qualified leads in range — same rows as export “Qualified pipeline
          detail”
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] font-semibold uppercase tracking-wider text-lf-subtle">
                <th className="pb-3 pr-4 font-medium">Lead</th>
                <th className="pb-3 pr-4 font-medium">Creator</th>
                <th className="pb-3 pr-4 font-medium">Qualified on</th>
                <th className="pb-3 pr-4 font-medium">Pipeline</th>
                <th className="pb-3 font-medium">Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pipelineQualified.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="py-8 text-center text-lf-subtle"
                  >
                    No qualified leads in range.
                  </td>
                </tr>
              ) : (
                pipelineQualified.slice(0, 12).map((l) => {
                  const pill = pipelinePillForLead(
                    l.qualificationStatus,
                    l.salesStage,
                  );
                  return (
                    <tr key={l.id}>
                      <td className="py-3 pr-4 font-semibold text-lf-text">
                        {l.leadName || "—"}
                      </td>
                      <td className="py-3 pr-4 text-lf-text-secondary">
                        {l.createdByName}
                      </td>
                      <td className="py-3 pr-4 text-lf-muted">
                        {formatAnalystDate(l.createdAt)}
                      </td>
                      <td className="py-3 pr-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${pill.className}`}
                        >
                          {pill.label}
                        </span>
                      </td>
                      <td className="max-w-xs py-3 text-lf-muted">
                        {pipelineNoteForLead(
                          l.qualificationStatus,
                          l.salesStage,
                          l.notes,
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <h2 className="mb-4 text-base font-semibold text-lf-text">
          Full lead snapshot
        </h2>
        <p className="mt-1 text-sm text-lf-muted">
          Every lead in scope (same as export “Lead snapshot” table)
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] font-semibold uppercase tracking-wider text-lf-subtle">
                <th className="pb-3 pr-4 font-medium">Lead</th>
                <th className="pb-3 pr-4 font-medium">Created by</th>
                <th className="pb-3 pr-4 font-medium">Source</th>
                <th className="pb-3 pr-4 font-medium">Stage</th>
                <th className="pb-3 font-medium">Assigned rep</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {allLeads.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="py-8 text-center text-lf-subtle"
                  >
                    No leads in range.
                  </td>
                </tr>
              ) : (
                allLeads.map((l) => (
                  <tr key={l.id} className="text-lf-muted">
                    <td className="py-2.5 pr-4 font-medium text-lf-text">
                      {l.leadName ?? "—"}
                    </td>
                    <td className="py-2.5 pr-4">{l.createdByName}</td>
                    <td className="py-2.5 pr-4 text-xs">
                      {sourcePillText(l.source)}
                    </td>
                    <td className="py-2.5 pr-4 text-xs">
                      {pipelinePillForLead(
                        l.qualificationStatus,
                        l.salesStage,
                      ).label}
                    </td>
                    <td className="py-2.5 text-xs">
                      {l.assignedRepName ?? "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
