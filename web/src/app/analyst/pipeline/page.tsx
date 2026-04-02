import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import AnalystDateRangeBarSuspense from "@/components/analyst/analyst-date-range-bar-suspense";
import {
  analystRangeParams,
  analystRangeSummaryLabel,
  leadWhereWithDateRange,
} from "@/lib/analyst-date-range";
import { AnalystPipelineTableClient } from "@/components/portal-leads/analyst-pipeline-table-client";
import { QualificationStatus, SalesStage } from "@/lib/constants";

export default async function AnalystPipelinePage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; q?: string }>;
}) {
  const session = await getSession();
  if (!session) return null;

  const { from, to, q } = await analystRangeParams(searchParams);
  const rangeLabel = analystRangeSummaryLabel(from, to);

  const leads = await prisma.lead.findMany({
    where: leadWhereWithDateRange(session.id, from, to),
    orderBy: { createdAt: "desc" },
  });

  const qualified = leads.filter(
    (l) => l.qualificationStatus === QualificationStatus.QUALIFIED,
  );

  const assigned = qualified.filter(
    (l) => l.salesStage === SalesStage.WITH_TEAM_LEAD,
  ).length;
  const inProgress = qualified.filter(
    (l) => l.salesStage === SalesStage.WITH_EXECUTIVE,
  ).length;
  const won = qualified.filter(
    (l) => l.salesStage === SalesStage.CLOSED_WON,
  ).length;
  const lost = qualified.filter(
    (l) => l.salesStage === SalesStage.CLOSED_LOST,
  ).length;

  const qualifiedRows = qualified.map((l) => ({
    id: l.id,
    leadName: l.leadName,
    phone: l.phone,
    source: l.source,
    notes: l.notes,
    qualificationStatus: l.qualificationStatus,
    salesStage: l.salesStage,
    leadScore: l.leadScore,
    createdAt: l.createdAt.toISOString(),
  }));

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-lf-text md:text-3xl">
          Pipeline status
        </h1>
        {rangeLabel !== "All time" ? (
          <p className="mt-1 text-sm text-lf-muted">{rangeLabel}</p>
        ) : null}
      </header>

      <AnalystDateRangeBarSuspense />

      <div className="flex gap-3 rounded-xl border border-lf-accent/30 bg-lf-accent/10 px-4 py-3 text-sm text-lf-link">
        <span className="shrink-0 font-bold text-lf-link" aria-hidden>
          ⓘ
        </span>
        <p>
          You can see outcome statuses for privacy — sales executive names and
          call details are not shown here.
        </p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {(
          [
            ["Assigned", assigned, "text-lf-warning"],
            ["In progress", inProgress, "text-lf-accent"],
            ["Closed won", won, "text-lf-success"],
            ["Closed lost", lost, "text-lf-danger"],
          ] as const
        ).map(([label, val, color]) => (
          <div
            key={label}
            className="rounded-2xl border border-slate-100 bg-lf-surface p-5"
          >
            <p className="text-[10px] font-semibold uppercase tracking-wider text-lf-subtle">
              {label}
            </p>
            <p className={`mt-2 text-3xl font-bold tabular-nums ${color}`}>
              {val}
            </p>
          </div>
        ))}
      </section>

      <AnalystPipelineTableClient
        key={`${from ?? ""}|${to ?? ""}`}
        qualified={qualifiedRows}
        initialQ={q}
        from={from}
        to={to}
      />
    </div>
  );
}
