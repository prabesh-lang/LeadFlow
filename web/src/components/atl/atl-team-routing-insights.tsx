import { dbQuery } from "@/lib/db/pool";
import { atlLeadSql } from "@/lib/atl-leads";
import { computeAtlInsights } from "@/lib/atl-insights";
import { analystFacingSalesLabel } from "@/lib/sales-stage-labels";
import { formatLeadSourceDisplay } from "@/lib/lead-sources";

function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-lf-border bg-lf-surface p-5 shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}

function StatCard({
  accent,
  title,
  value,
  sub,
}: {
  accent: "blue" | "green" | "violet" | "red";
  title: string;
  value: string | number;
  sub: string;
}) {
  const border =
    accent === "blue"
      ? "border-t-lf-accent"
      : accent === "green"
        ? "border-t-lf-link"
        : accent === "violet"
          ? "border-t-lf-accent"
          : "border-t-lf-danger";
  return (
    <Card className={`border-t-4 ${border}`}>
      <p className="text-xs font-medium uppercase tracking-wide text-lf-subtle">
        {title}
      </p>
      <p className="mt-2 text-2xl font-bold tabular-nums text-lf-text md:text-3xl">
        {value}
      </p>
      <p className="mt-1 text-xs text-lf-muted">{sub}</p>
    </Card>
  );
}

export async function AtlTeamRoutingInsights({
  analystIds,
}: {
  analystIds: string[];
}) {
  const { clause, params } = atlLeadSql(analystIds, null, null);
  const leads =
    analystIds.length === 0
      ? []
      : await dbQuery<{
          qualificationStatus: string;
          salesStage: string;
          source: string;
        }>(
          `SELECT "qualificationStatus", "salesStage", source FROM "Lead" WHERE ${clause}`,
          params,
        );

  const ins = computeAtlInsights(leads);

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          accent="blue"
          title="Total team leads"
          value={ins.total}
          sub="From your analysts · all time"
        />
        <StatCard
          accent="green"
          title="Qualified"
          value={ins.qualified}
          sub={`${ins.qualRate}% of total`}
        />
        <StatCard
          accent="violet"
          title="Routed to sales"
          value={ins.routed}
          sub={`${ins.withExec} with exec · ${ins.closedWon} won`}
        />
        <StatCard
          accent="red"
          title="Not qualified / Irrelevant"
          value={ins.notQ + ins.irrelevant}
          sub={`${ins.notQ} NQ · ${ins.irrelevant} irr.`}
        />
      </section>

      <Card>
        <h3 className="text-base font-semibold text-lf-text">
          Breakdown by status &amp; stage
        </h3>
        <div className="mt-6 grid gap-8 lg:grid-cols-2">
          <div>
            <h4 className="text-sm font-semibold text-lf-text-secondary">
              By lead status
            </h4>
            <p className="mt-1 text-xs text-lf-subtle">
              Qualification outcome (all team leads)
            </p>
            <ul className="mt-4 space-y-4">
              {ins.total === 0 ? (
                <li className="text-sm text-lf-subtle">No leads yet.</li>
              ) : (
                ins.qualInsightRows.map(({ label, count, barClass, pct }) => (
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
                          width: `${Math.max(4, (count / ins.maxQualBar) * 100)}%`,
                        }}
                      />
                    </div>
                  </li>
                ))
              )}
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-lf-text-secondary">
              By sales routing stage
            </h4>
            <p className="mt-1 text-xs text-lf-subtle">
              Pipeline position (all leads)
            </p>
            <ul className="mt-4 space-y-4">
              {ins.total === 0 ? (
                <li className="text-sm text-lf-subtle">No leads yet.</li>
              ) : (
                ins.stageEntries.map(([stage, count]) => (
                  <li key={stage}>
                    <div className="mb-1 flex justify-between text-xs text-lf-muted">
                      <span className="font-medium text-lf-text-secondary">
                        {analystFacingSalesLabel(stage)}
                      </span>
                      <span className="tabular-nums text-lf-text">{count}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-lf-bg">
                      <div
                        className="h-full rounded-full bg-lf-link"
                        style={{
                          width: `${Math.max(
                            4,
                            (count / ins.maxStageBar) * 100,
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

      <Card>
        <h3 className="text-base font-semibold text-lf-text">
          Qualified leads passed to sales
        </h3>
        <p className="mt-1 text-sm text-lf-muted">
          Qualified leads that have left internal routing
        </p>
        <div className="mt-6 flex flex-wrap items-end gap-6 border-b border-lf-border pb-6">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-lf-subtle">
              Passed
            </p>
            <p className="mt-1 text-4xl font-bold tabular-nums text-lf-text">
              {ins.qualifiedPassedCount}
            </p>
            <p className="mt-1 text-xs text-lf-subtle">
              {ins.qualified > 0
                ? `${ins.passedPct}% of qualified`
                : "No qualified leads"}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-lf-subtle">
              Still internal (qualified)
            </p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-lf-muted">
              {ins.qualifiedInternalCount}
            </p>
            <p className="mt-1 text-xs text-lf-subtle">
              Awaiting routing to a main team
            </p>
          </div>
        </div>
        {ins.qualifiedPassedCount > 0 ? (
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {(
              [
                ["With main team (no rep yet)", ins.passedWithTl],
                ["With sales executive", ins.passedWithExec],
                ["Closed — won", ins.passedWon],
                ["Closed — lost", ins.passedLost],
              ] as const
            ).map(([label, val]) => (
              <div
                key={label}
                className="rounded-xl border border-lf-border bg-lf-bg px-4 py-3"
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

      <Card>
        <h3 className="mb-4 text-base font-semibold text-lf-text">
          Leads by source (all time)
        </h3>
        <ul className="space-y-4">
          {ins.sourceEntries.length === 0 ? (
            <li className="text-sm text-lf-subtle">No data yet.</li>
          ) : (
            ins.sourceEntries.slice(0, 8).map(([label, count]) => (
              <li key={label}>
                <div className="mb-1 flex justify-between text-xs text-lf-muted">
                  <span
                    className="truncate pr-2 font-medium text-lf-text-secondary"
                    title={label}
                  >
                    {formatLeadSourceDisplay(label)}
                  </span>
                  <span className="shrink-0 tabular-nums text-lf-text">
                    {count}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-lf-bg">
                  <div
                    className="h-full rounded-full bg-lf-link"
                    style={{
                      width: `${Math.max(8, (count / ins.maxSource) * 100)}%`,
                    }}
                  />
                </div>
              </li>
            ))
          )}
        </ul>
      </Card>
    </div>
  );
}
