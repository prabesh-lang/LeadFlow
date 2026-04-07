"use client";

import { useMemo, useState } from "react";
import AnalystNotesReadonly from "@/components/analyst-notes-readonly";
import ExecLostNotesReadonly from "@/components/exec-lost-notes-readonly";
import { AssignToExecForm } from "@/components/mtl/assign-to-exec-form";
import { LeadSourcePill } from "@/components/lead-source-display";
import { PortalLeadSearchLiveField } from "@/components/portal-lead-search-live-field";
import { DashboardReportExport } from "@/components/dashboard-report-export";
import { SalesStage } from "@/lib/constants";
import { filterLeadsByNameOrPhone } from "@/lib/lead-client-search";
import { buildMtlLeadsExportPayload } from "@/lib/mtl-leads-export";
import { useDebouncedLeadSearchUrl } from "@/lib/use-debounced-lead-search-url";
import type { MtlLeadRow } from "@/lib/mtl-lead-row";

export type { MtlLeadRow };

export function MtlLeadsTableClient({
  leads,
  initialQ,
  execs,
  rangeLabel,
}: {
  leads: MtlLeadRow[];
  initialQ: string | null;
  execs: { id: string; name: string }[];
  rangeLabel: string;
}) {
  const [query, setQuery] = useState(initialQ ?? "");
  useDebouncedLeadSearchUrl(query);

  const filtered = useMemo(
    () => filterLeadsByNameOrPhone(leads, query),
    [leads, query],
  );

  const exportPayload = useMemo(
    () =>
      buildMtlLeadsExportPayload(filtered, {
        rangeLabel,
        searchQuery: query,
      }),
    [filtered, rangeLabel, query],
  );

  const hasQuery = query.trim().length > 0;

  return (
    <>
      <div className="rounded-2xl border border-lf-border bg-gradient-to-b from-lf-elevated to-lf-bg px-4 py-4 shadow-sm sm:px-5 sm:py-5">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-lf-subtle">
          Find a client
        </p>
        <PortalLeadSearchLiveField value={query} onChange={setQuery} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-lf-border bg-lf-surface px-4 py-4 shadow-sm sm:px-5 sm:py-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-lf-subtle">
            Export leads
          </p>
          <p className="mt-1 text-sm text-lf-muted">
            PDF, Excel, or CSV for the leads shown below. Uses the date range
            above and your search filter.
          </p>
        </div>
        <div className="shrink-0">
          <DashboardReportExport payload={exportPayload} />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-lf-border bg-lf-surface shadow-sm">
        <div className="overflow-x-auto">
        <table className="min-w-[1400px] w-full table-fixed text-left text-sm">
          <thead className="border-b border-lf-border bg-lf-bg/70 text-xs uppercase tracking-wide text-lf-subtle">
            <tr>
              <th className="w-[150px] px-4 py-3 font-semibold">Name</th>
              <th className="w-[130px] px-4 py-3 font-semibold">Phone</th>
              <th className="w-[190px] px-4 py-3 font-semibold">Email</th>
              <th className="w-[240px] px-4 py-3 font-semibold">Source</th>
              <th className="w-[120px] px-4 py-3 font-semibold">Analyst</th>
              <th className="w-[80px] px-4 py-3 font-semibold">Score</th>
              <th className="w-[130px] px-4 py-3 font-semibold">Stage</th>
              <th className="w-[230px] px-4 py-3 font-semibold">Analyst notes</th>
              <th className="w-[230px] px-4 py-3 font-semibold">Executive notes</th>
              <th className="w-[120px] px-4 py-3 font-semibold">Rep</th>
              <th className="w-[150px] px-4 py-3 font-semibold">Deadline</th>
              <th className="w-[170px] px-4 py-3 font-semibold">Assign</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-lf-divide">
            {leads.length === 0 ? (
              <tr>
                <td
                  colSpan={12}
                  className="px-4 py-10 text-center text-lf-subtle"
                >
                  No leads in this range.
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={12}
                  className="px-4 py-10 text-center text-lf-subtle"
                >
                  {hasQuery
                    ? "No leads match this name or phone in the current filters."
                    : "No leads in this range."}
                </td>
              </tr>
            ) : (
              filtered.map((lead) => {
                const open =
                  lead.salesStage !== SalesStage.CLOSED_WON &&
                  lead.salesStage !== SalesStage.CLOSED_LOST;
                return (
                  <tr key={lead.id} className="align-top odd:bg-lf-bg/[0.16] hover:bg-lf-bg/[0.28]">
                    <td className="px-4 py-3 font-medium text-lf-text">
                      {lead.leadName || "—"}
                    </td>
                    <td className="px-4 py-3 text-lf-muted">
                      {lead.phone || "—"}
                    </td>
                    <td className="px-4 py-3 text-lf-muted">
                      {lead.leadEmail || "—"}
                    </td>
                    <td className="px-4 py-3 text-lf-text-secondary">
                      <LeadSourcePill source={lead.source} />
                    </td>
                    <td className="px-4 py-3 text-lf-muted">
                      {lead.createdBy.name}
                    </td>
                    <td className="px-4 py-3 text-lf-muted">
                      {lead.leadScore ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-lf-muted">
                      <span className="rounded-full bg-lf-bg px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-lf-text-secondary">
                        {lead.salesStage.replaceAll("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <AnalystNotesReadonly notes={lead.notes} />
                    </td>
                    <td className="px-4 py-3 align-top">
                      <ExecLostNotesReadonly notes={lead.lostNotes} />
                    </td>
                    <td className="px-4 py-3 text-lf-muted">
                      {lead.assignedSalesExec?.name ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-xs text-lf-subtle">
                      {lead.execDeadlineAt
                        ? new Date(lead.execDeadlineAt).toLocaleString()
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      {open && execs.length > 0 ? (
                        <AssignToExecForm
                          leadId={lead.id}
                          execs={execs}
                          currentExecId={lead.assignedSalesExecId}
                        />
                      ) : (
                        <span className="text-xs text-lf-subtle">—</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        </div>
      </div>
    </>
  );
}
