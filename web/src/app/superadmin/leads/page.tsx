import type { Metadata } from "next";
import { Suspense } from "react";
import { SuperadminLeadsFiltersBar } from "@/components/superadmin/superadmin-leads-filters";
import { QualificationStatus, UserRole } from "@/lib/constants";
import { getSuperadminLeadsWithJourney } from "@/lib/superadmin-stats";
import {
  buildSuperadminLeadsWhere,
  parseSuperadminLeadsSearchParams,
  superadminLeadsFilterSummary,
} from "@/lib/superadmin-leads-filters";
import { analystFacingSalesLabel } from "@/lib/sales-stage-labels";
import {
  superadminHandoffLabels,
  superadminRoleLabel,
} from "@/lib/superadmin-ui";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Leads · Superadmin",
};

function QualSummaryCard({
  title,
  count,
  accent,
}: {
  title: string;
  count: number;
  accent: "positive" | "neutral" | "muted";
}) {
  const ring =
    accent === "positive"
      ? "border-lf-success/35 bg-lf-success/[0.07]"
      : accent === "neutral"
        ? "border-lf-warning/35 bg-lf-warning/[0.07]"
        : "border-white/10 bg-lf-bg/80";
  return (
    <div className={`rounded-xl border px-5 py-4 ${ring}`}>
      <p className="text-xs font-medium uppercase tracking-wide text-lf-subtle">
        {title}
      </p>
      <p className="mt-2 text-3xl font-semibold tabular-nums text-white">
        {count}
      </p>
    </div>
  );
}

export default async function SuperadminLeadsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const parsed = parseSuperadminLeadsSearchParams(sp);
  const where = buildSuperadminLeadsWhere(parsed);

  const [teams, execs, { qualTotals, analystGroups }] = await Promise.all([
    prisma.team.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.user.findMany({
      where: { role: UserRole.SALES_EXECUTIVE },
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true },
    }),
    getSuperadminLeadsWithJourney(where),
  ]);

  const teamMeta = parsed.teamId
    ? teams.find((t) => t.id === parsed.teamId)
    : null;
  const teamName = teamMeta?.name ?? null;
  const execUser = parsed.execId
    ? execs.find((e) => e.id === parsed.execId)
    : null;
  const execLabel = execUser
    ? `${execUser.name} (${execUser.email})`
    : null;

  const filterSummary = superadminLeadsFilterSummary(parsed, {
    teamName,
    execLabel,
  });

  const filtersKey = `${parsed.from ?? ""}|${parsed.to ?? ""}|${parsed.dateBasis}|${parsed.scope}|${parsed.teamId ?? ""}|${parsed.execId ?? ""}`;

  return (
    <div className="space-y-12">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-white">
          Leads
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-lf-muted">
          Every lead grouped by the Lead Analyst who created it, with
          qualification status, current stage, and the recorded journey
          (handoff log). Filter by date range, assignment date, team, or sales
          executive.
        </p>
        <p className="mt-2 text-xs text-lf-subtle">{filterSummary}</p>
      </div>

      <Suspense
        fallback={
          <div className="h-40 animate-pulse rounded-xl border border-white/10 bg-lf-surface/90" />
        }
      >
        <SuperadminLeadsFiltersBar
          key={filtersKey}
          initial={parsed}
          teams={teams}
          execs={execs}
        />
      </Suspense>

      <div className="grid gap-4 sm:grid-cols-3">
        <QualSummaryCard
          title="Qualified"
          count={qualTotals.qualified}
          accent="positive"
        />
        <QualSummaryCard
          title="Not qualified"
          count={qualTotals.notQualified}
          accent="neutral"
        />
        <QualSummaryCard
          title="Irrelevant"
          count={qualTotals.irrelevant}
          accent="muted"
        />
      </div>

      {analystGroups.length === 0 ? (
        <p className="text-sm text-lf-subtle">
          No leads match these filters.
        </p>
      ) : (
        analystGroups.map(({ analyst, leads }) => (
          <section key={analyst.id} className="space-y-4">
            <div className="border-b border-white/10 pb-2">
              <h2 className="text-lg font-semibold text-white">{analyst.name}</h2>
              <p className="text-xs text-lf-subtle">{analyst.email}</p>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              {leads.map((lead) => (
                <div
                  key={lead.id}
                  className="rounded-xl border border-white/10 bg-lf-surface/90 p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-lf-text">
                        {lead.leadName || "Unnamed lead"}
                      </p>
                      <p className="mt-1 text-xs text-lf-subtle">
                        Created {lead.createdAt.toLocaleString()}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${
                        lead.qualificationStatus ===
                        QualificationStatus.QUALIFIED
                          ? "bg-lf-success/15 text-lf-success"
                          : lead.qualificationStatus ===
                              QualificationStatus.NOT_QUALIFIED
                            ? "bg-lf-warning/15 text-lf-warning"
                            : "bg-white/10 text-lf-text-secondary"
                      }`}
                    >
                      {lead.qualificationStatus.replace(/_/g, " ")}
                    </span>
                  </div>

                  <dl className="mt-4 space-y-2 text-xs text-lf-muted">
                    <div className="flex justify-between gap-4">
                      <dt>Stage</dt>
                      <dd className="text-right text-lf-text-secondary">
                        {analystFacingSalesLabel(lead.salesStage)}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt>Main team lead</dt>
                      <dd className="text-right text-lf-text-secondary">
                        {lead.assignedMainTeamLead?.name ?? "—"}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt>Team</dt>
                      <dd className="text-right text-lf-text-secondary">
                        {lead.team?.name ?? "—"}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt>Sales executive</dt>
                      <dd className="text-right text-lf-text-secondary">
                        {lead.assignedSalesExec?.name ?? "—"}
                      </dd>
                    </div>
                  </dl>

                  <div className="mt-4 border-t border-white/10 pt-4">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-lf-subtle">
                      Journey
                    </p>
                    {lead.handoffLogs.length === 0 ? (
                      <p className="mt-2 text-xs text-lf-subtle">
                        No handoff events recorded (older leads or pre-log).
                      </p>
                    ) : (
                      <ol className="mt-3 space-y-3">
                        {lead.handoffLogs.map((h) => (
                          <li
                            key={h.id}
                            className="relative border-l border-white/10 pl-4 text-xs"
                          >
                            <span className="absolute -left-[5px] top-1.5 h-2 w-2 rounded-full bg-lf-muted" />
                            <p className="text-lf-subtle">
                              {h.createdAt.toLocaleString()}
                            </p>
                            <p className="mt-0.5 font-medium text-lf-text-secondary">
                              {superadminHandoffLabels[h.action] ?? h.action}
                            </p>
                            {h.actor ? (
                              <p className="mt-0.5 text-lf-subtle">
                                {h.actor.name} ·{" "}
                                {superadminRoleLabel(h.actor.role)}
                              </p>
                            ) : null}
                            {h.detail ? (
                              <p className="mt-1 text-lf-subtle">{h.detail}</p>
                            ) : null}
                          </li>
                        ))}
                      </ol>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
