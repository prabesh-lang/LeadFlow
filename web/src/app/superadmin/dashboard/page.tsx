import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import {
  superadminHandoffLabels,
  superadminRoleLabel,
} from "@/lib/superadmin-ui";
import { getSuperadminDashboardMetrics } from "@/lib/superadmin-stats";

export const metadata: Metadata = {
  title: "Dashboard · Superadmin",
};

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-lf-border bg-lf-surface/90 px-5 py-4">
      <p className="text-xs font-medium uppercase tracking-wide text-lf-subtle">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold tabular-nums text-lf-text">
        {value}
      </p>
      {hint ? (
        <p className="mt-2 text-xs leading-relaxed text-lf-subtle">{hint}</p>
      ) : null}
    </div>
  );
}

export default async function SuperadminDashboardPage() {
  const [metrics, handoffs, seTransfers] = await Promise.all([
    getSuperadminDashboardMetrics(),
    prisma.leadHandoffLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 80,
      include: {
        lead: { select: { leadName: true, id: true } },
        actor: { select: { name: true, email: true, role: true } },
      },
    }),
    prisma.salesExecTeamTransfer.findMany({
      orderBy: { createdAt: "desc" },
      take: 40,
      include: {
        salesExec: { select: { name: true, email: true } },
        fromTeam: { select: { name: true } },
        toTeam: { select: { name: true } },
        transferredBy: { select: { name: true, email: true } },
      },
    }),
  ]);

  return (
    <div className="space-y-12">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-lf-text">
          Dashboard
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-lf-muted">
          Snapshot of users, pipeline volume, and how leads are associated with
          teams and sales executives (current assignments).
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          label="Active users"
          value={metrics.activeUsers}
          hint="Analysts, TLs, main TLs, sales execs"
        />
        <StatCard label="Total leads" value={metrics.totalLeads} />
        <StatCard label="Qualified leads" value={metrics.qualified} />
        <StatCard label="Not qualified" value={metrics.notQualified} />
        <StatCard label="Irrelevant leads" value={metrics.irrelevant} />
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div>
          <h2 className="text-sm font-semibold text-lf-text-secondary">
            Leads routed to teams
          </h2>
          <p className="mt-1 text-xs text-lf-subtle">
            Count of leads with a team assignment (current state).
          </p>
          <div className="mt-4 overflow-x-auto rounded-xl border border-lf-border">
            <table className="w-full min-w-[280px] text-left text-sm">
              <thead className="border-b border-lf-border bg-lf-bg/90 text-xs uppercase text-lf-subtle">
                <tr>
                  <th className="px-4 py-3 font-medium">Team</th>
                  <th className="px-4 py-3 font-medium">Leads</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-lf-divide">
                {metrics.leadsByTeam.length === 0 ? (
                  <tr>
                    <td
                      colSpan={2}
                      className="px-4 py-6 text-center text-sm text-lf-subtle"
                    >
                      No team-routed leads yet.
                    </td>
                  </tr>
                ) : (
                  metrics.leadsByTeam.map((row) => (
                    <tr key={row.teamId}>
                      <td className="px-4 py-3 text-lf-text-secondary">{row.teamName}</td>
                      <td className="px-4 py-3 tabular-nums text-lf-muted">
                        {row.count}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        <div>
          <h2 className="text-sm font-semibold text-lf-text-secondary">
            Leads with sales executive
          </h2>
          <p className="mt-1 text-xs text-lf-subtle">
            Count of leads currently assigned to each rep (or historically
            holding assignment).
          </p>
          <div className="mt-4 overflow-x-auto rounded-xl border border-lf-border">
            <table className="w-full min-w-[280px] text-left text-sm">
              <thead className="border-b border-lf-border bg-lf-bg/90 text-xs uppercase text-lf-subtle">
                <tr>
                  <th className="px-4 py-3 font-medium">Sales executive</th>
                  <th className="px-4 py-3 font-medium">Leads</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-lf-divide">
                {metrics.leadsBySalesExec.length === 0 ? (
                  <tr>
                    <td
                      colSpan={2}
                      className="px-4 py-6 text-center text-sm text-lf-subtle"
                    >
                      No assignments yet.
                    </td>
                  </tr>
                ) : (
                  metrics.leadsBySalesExec.map((row) => (
                    <tr key={row.salesExecId}>
                      <td className="max-w-[240px] px-4 py-3 text-xs text-lf-text-secondary">
                        {row.label}
                      </td>
                      <td className="px-4 py-3 tabular-nums text-lf-muted">
                        {row.count}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-lf-text">Lead transfer log</h2>
        <p className="text-sm text-lf-subtle">
          Recent routing and close events (newest first).
        </p>
        <div className="overflow-x-auto rounded-xl border border-lf-border">
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead className="border-b border-lf-border bg-lf-bg/90 text-xs uppercase tracking-wide text-lf-subtle">
              <tr>
                <th className="px-4 py-3 font-medium">When</th>
                <th className="px-4 py-3 font-medium">Lead</th>
                <th className="px-4 py-3 font-medium">Action</th>
                <th className="px-4 py-3 font-medium">Actor</th>
                <th className="px-4 py-3 font-medium">Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-lf-divide">
              {handoffs.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-sm text-lf-subtle"
                  >
                    No handoff events yet.
                  </td>
                </tr>
              ) : (
                handoffs.map((h) => (
                  <tr key={h.id} className="align-top">
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-lf-subtle">
                      {h.createdAt.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-lf-text-secondary">
                      {h.lead.leadName || h.lead.id.slice(0, 8)}
                    </td>
                    <td className="px-4 py-3 text-lf-muted">
                      {superadminHandoffLabels[h.action] ?? h.action}
                    </td>
                    <td className="px-4 py-3 text-xs text-lf-text-secondary">
                      {h.actor ? (
                        <>
                          {h.actor.name}
                          <br />
                          <span className="text-lf-subtle">
                            {superadminRoleLabel(h.actor.role)} ·{" "}
                            {h.actor.email}
                          </span>
                        </>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="max-w-md px-4 py-3 text-xs text-lf-subtle">
                      {h.detail ?? "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-lf-text">
          Sales executive team transfers
        </h2>
        <p className="text-sm text-lf-subtle">
          When a main team lead moves a rep to another team.
        </p>
        <div className="overflow-x-auto rounded-xl border border-lf-border">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-lf-border bg-lf-bg/90 text-xs uppercase tracking-wide text-lf-subtle">
              <tr>
                <th className="px-4 py-3 font-medium">When</th>
                <th className="px-4 py-3 font-medium">Sales executive</th>
                <th className="px-4 py-3 font-medium">From team</th>
                <th className="px-4 py-3 font-medium">To team</th>
                <th className="px-4 py-3 font-medium">Transferred by (MTL)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-lf-divide">
              {seTransfers.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-sm text-lf-subtle"
                  >
                    No sales executive transfers recorded yet.
                  </td>
                </tr>
              ) : (
                seTransfers.map((t) => (
                  <tr key={t.id} className="align-top">
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-lf-subtle">
                      {t.createdAt.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-xs text-lf-text-secondary">
                      {t.salesExec.name}
                      <br />
                      <span className="text-lf-subtle">{t.salesExec.email}</span>
                    </td>
                    <td className="px-4 py-3 text-lf-muted">
                      {t.fromTeam?.name ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-lf-text-secondary">{t.toTeam.name}</td>
                    <td className="px-4 py-3 text-xs text-lf-text-secondary">
                      {t.transferredBy.name}
                      <br />
                      <span className="text-lf-subtle">
                        {t.transferredBy.email}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
