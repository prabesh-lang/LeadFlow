import type { Metadata } from "next";
import Link from "next/link";
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
import { PortalLeadsExportBar } from "@/components/portal-leads-export-bar";
import { flattenSuperadminJourneyGroupsForExport } from "@/lib/superadmin-leads-export-map";
import { buildSuperadminLeadsExportPayload } from "@/lib/portal-all-leads-export-payloads";
import { PORTAL_LEADS_EXPORT_ROW_CAP } from "@/lib/portal-leads-export-cap";

export const metadata: Metadata = {
  title: "Leads · Superadmin",
};

function PaginationBar({
  totalCount,
  offset,
  perPage,
  page,
  totalPages,
  prevHref,
  nextHref,
}: {
  totalCount: number;
  offset: number;
  perPage: number;
  page: number;
  totalPages: number;
  prevHref: string | null;
  nextHref: string | null;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-lf-border bg-lf-surface/80 px-4 py-3 text-sm">
      <p className="text-lf-subtle">
        Showing{" "}
        <span className="font-semibold text-lf-text">
          {totalCount === 0 ? 0 : offset + 1}-
          {Math.min(offset + perPage, totalCount)}
        </span>{" "}
        of <span className="font-semibold text-lf-text">{totalCount}</span> leads
      </p>
      <div className="flex items-center gap-2">
        {prevHref ? (
          <Link
            href={prevHref}
            className="rounded-lg border border-lf-border px-3 py-1.5 text-xs font-medium text-lf-text-secondary hover:bg-lf-bg/50"
          >
            Previous
          </Link>
        ) : (
          <span className="rounded-lg border border-lf-border px-3 py-1.5 text-xs text-lf-subtle opacity-50">
            Previous
          </span>
        )}
        <span className="text-xs text-lf-subtle">
          Page {Math.min(page, totalPages)} of {totalPages}
        </span>
        {nextHref ? (
          <Link
            href={nextHref}
            className="rounded-lg border border-lf-border px-3 py-1.5 text-xs font-medium text-lf-text-secondary hover:bg-lf-bg/50"
          >
            Next
          </Link>
        ) : (
          <span className="rounded-lg border border-lf-border px-3 py-1.5 text-xs text-lf-subtle opacity-50">
            Next
          </span>
        )}
      </div>
    </div>
  );
}

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
  const page = Math.max(1, parsed.page);
  const perPage = parsed.perPage;
  const offset = (page - 1) * perPage;

  const [teams, execs, analysts, counts, paged, exportPack] = await Promise.all([
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
    dbQuery<{
      total: string;
      qualified: string;
      notQualified: string;
      irrelevant: string;
    }>(
      `SELECT
         COUNT(*)::text AS total,
         COUNT(*) FILTER (WHERE "qualificationStatus" = 'QUALIFIED')::text AS qualified,
         COUNT(*) FILTER (WHERE "qualificationStatus" = 'NOT_QUALIFIED')::text AS "notQualified",
         COUNT(*) FILTER (WHERE "qualificationStatus" = 'IRRELEVANT')::text AS irrelevant
       FROM "Lead"
       WHERE ${where.clause}`,
      where.params,
    ),
    getSuperadminLeadsWithJourney(where, { limit: perPage, offset }),
    getSuperadminLeadsWithJourney(where, {
      limit: PORTAL_LEADS_EXPORT_ROW_CAP,
      offset: 0,
    }),
  ]);
  const qualTotals = {
    qualified: Number(counts[0]?.qualified ?? 0),
    notQualified: Number(counts[0]?.notQualified ?? 0),
    irrelevant: Number(counts[0]?.irrelevant ?? 0),
  };
  const totalCount = Number(counts[0]?.total ?? 0);
  const totalPages = Math.max(1, Math.ceil(totalCount / perPage));
  const analystGroups = paged.analystGroups;

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
  const superadminExportRows = flattenSuperadminJourneyGroupsForExport(
    exportPack.analystGroups,
  );
  const superadminExportPayload = buildSuperadminLeadsExportPayload(
    superadminExportRows,
    {
      filterSummary,
      rangeTotalCount: totalCount,
      exportRowCount: superadminExportRows.length,
    },
  );

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

  const filtersKey = `${parsed.from ?? ""}|${parsed.to ?? ""}|${parsed.status}|${parsed.analystId ?? ""}|${parsed.teamId ?? ""}|${parsed.execId ?? ""}|${parsed.perPage}|${parsed.page}`;
  const qp = new URLSearchParams();
  if (parsed.from) qp.set("from", parsed.from);
  if (parsed.to) qp.set("to", parsed.to);
  if (parsed.status) qp.set("status", parsed.status);
  if (parsed.analystId) qp.set("analystId", parsed.analystId);
  if (parsed.teamId) qp.set("teamId", parsed.teamId);
  if (parsed.execId) qp.set("execId", parsed.execId);
  qp.set("perPage", String(perPage));
  const prevHref =
    page > 1
      ? `/superadmin/leads?${new URLSearchParams({
          ...Object.fromEntries(qp.entries()),
          page: String(page - 1),
        }).toString()}`
      : null;
  const nextHref =
    page < totalPages
      ? `/superadmin/leads?${new URLSearchParams({
          ...Object.fromEntries(qp.entries()),
          page: String(page + 1),
        }).toString()}`
      : null;

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

      <SuperadminLeadsFiltersBar
        key={filtersKey}
        initial={parsed}
        analysts={analysts}
        teams={teams}
        execs={execs}
      />

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

      <PortalLeadsExportBar
        payload={superadminExportPayload}
        description="PDF, Excel, or CSV for every lead matching the filters and date range above (up to the export row limit in the summary)."
      />

      <PaginationBar
        totalCount={totalCount}
        offset={offset}
        perPage={perPage}
        page={page}
        totalPages={totalPages}
        prevHref={prevHref}
        nextHref={nextHref}
      />

      {analystGroups.length === 0 ? (
        <p className="text-sm text-lf-subtle">
          No leads match these filters.
        </p>
      ) : (
        <>
          <SuperadminLeadsJourneyClient analystGroups={analystGroupsClient} />
          <PaginationBar
            totalCount={totalCount}
            offset={offset}
            perPage={perPage}
            page={page}
            totalPages={totalPages}
            prevHref={prevHref}
            nextHref={nextHref}
          />
        </>
      )}
    </div>
  );
}
