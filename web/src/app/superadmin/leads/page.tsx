import type { Metadata } from "next";
import { Suspense } from "react";
import { SuperadminLeadsFiltersBar } from "@/components/superadmin/superadmin-leads-filters";
import { UserRole } from "@/lib/constants";
import { getSuperadminLeadsWithJourney } from "@/lib/superadmin-stats";
import {
  buildSuperadminLeadsWhereSql,
  parseSuperadminLeadsSearchParams,
  superadminLeadsFilterSummary,
} from "@/lib/superadmin-leads-filters";
import { dbQuery } from "@/lib/db/pool";
import { SuperadminLeadsJourneyClient } from "@/components/superadmin/superadmin-leads-journey-client";

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
        : "border-lf-border bg-lf-bg/80";
  return (
    <div className={`rounded-xl border px-5 py-4 ${ring}`}>
      <p className="text-xs font-medium uppercase tracking-wide text-lf-subtle">
        {title}
      </p>
      <p className="mt-2 text-3xl font-semibold tabular-nums text-lf-text">
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
  const where = buildSuperadminLeadsWhereSql(parsed);

  const [teams, execs, analysts, { qualTotals, analystGroups }] = await Promise.all([
    dbQuery<{ id: string; name: string }>(
      `SELECT id, name FROM "Team" ORDER BY name ASC`,
    ),
    dbQuery<{ id: string; name: string; email: string }>(
      `SELECT id, name, email FROM "User" WHERE role = $1 ORDER BY name ASC`,
      [UserRole.SALES_EXECUTIVE],
    ),
    dbQuery<{ id: string; name: string; email: string }>(
      `SELECT id, name, email FROM "User" WHERE role = $1 ORDER BY name ASC`,
      [UserRole.LEAD_ANALYST],
    ),
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

  const analystUser = parsed.analystId
    ? analysts.find((a) => a.id === parsed.analystId)
    : null;
  const analystLabel = analystUser
    ? `${analystUser.name} (${analystUser.email})`
    : null;
  const filterSummary = superadminLeadsFilterSummary(parsed, {
    analystLabel,
    teamName,
    execLabel,
  });
  const analystGroupsClient = analystGroups.map((group) => ({
    analyst: group.analyst,
    leads: group.leads.map((lead) => ({
      id: lead.id,
      leadName: lead.leadName,
      createdAt: lead.createdAt.toISOString(),
      qualificationStatus: lead.qualificationStatus,
      source: lead.source,
      salesStage: lead.salesStage,
      assignedMainTeamLead: lead.assignedMainTeamLead,
      team: lead.team,
      assignedSalesExec: lead.assignedSalesExec,
      handoffLogs: lead.handoffLogs.map((h) => ({
        id: h.id,
        createdAt: h.createdAt.toISOString(),
        action: h.action,
        detail: h.detail,
        actor: h.actor,
      })),
    })),
  }));

  const filtersKey = `${parsed.from ?? ""}|${parsed.to ?? ""}|${parsed.status}|${parsed.analystId ?? ""}|${parsed.teamId ?? ""}|${parsed.execId ?? ""}`;

  return (
    <div className="space-y-12">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-lf-text">
          Leads
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-lf-muted">
          Every lead grouped by the Lead Analyst who created it, with
          qualification status, current stage, and the recorded journey
          (handoff log). Filter by date range, lead status, lead analyst, team,
          or sales executive.
        </p>
        <p className="mt-2 text-xs text-lf-subtle">{filterSummary}</p>
      </div>

      <Suspense
        fallback={
          <div className="h-40 animate-pulse rounded-xl border border-lf-border bg-lf-surface/90" />
        }
      >
        <SuperadminLeadsFiltersBar
          key={filtersKey}
          initial={parsed}
          analysts={analysts}
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
        <SuperadminLeadsJourneyClient analystGroups={analystGroupsClient} />
      )}
    </div>
  );
}
