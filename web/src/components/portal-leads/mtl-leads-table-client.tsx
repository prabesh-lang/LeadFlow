"use client";

import { useMemo, useState } from "react";
import AnalystNotesReadonly from "@/components/analyst-notes-readonly";
import ExecLostNotesReadonly from "@/components/exec-lost-notes-readonly";
import { AssignToExecForm } from "@/components/mtl/assign-to-exec-form";
import { LeadSourceDisplay } from "@/components/lead-source-display";
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

      <div className="overflow-x-auto rounded-2xl border border-lf-border bg-lf-surface">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-lf-border text-xs uppercase tracking-wide text-lf-subtle">
            <tr>
              <th className="px-4 py-3 font-semibold">Name</th>
              <th className="px-4 py-3 font-semibold">Phone</th>
              <th className="px-4 py-3 font-semibold">Email</th>
              <th className="px-4 py-3 font-semibold">Source</th>
              <th className="px-4 py-3 font-semibold">Analyst</th>
              <th className="px-4 py-3 font-semibold">Score</th>
              <th className="px-4 py-3 font-semibold">Stage</th>
              <th className="px-4 py-3 font-semibold">Analyst notes</th>
              <th className="px-4 py-3 font-semibold">Executive notes</th>
              <th className="px-4 py-3 font-semibold">Rep</th>
              <th className="px-4 py-3 font-semibold">Deadline</th>
              <th className="px-4 py-3 font-semibold">Assign</th>
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
                  <tr key={lead.id} className="align-top bg-lf-bg/40">
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
                      <LeadSourceDisplay source={lead.source} />
                    </td>
                    <td className="px-4 py-3 text-lf-muted">
                      {lead.createdBy.name}
                    </td>
                    <td className="px-4 py-3 text-lf-muted">
                      {lead.leadScore ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-lf-muted">
                      {lead.salesStage.replaceAll("_", " ")}
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
    </>
  );
}
