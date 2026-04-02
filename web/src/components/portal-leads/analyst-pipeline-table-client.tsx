"use client";

import { useMemo, useState } from "react";
import AnalystNotesReadonly from "@/components/analyst-notes-readonly";
import { PortalLeadSearchLiveField } from "@/components/portal-lead-search-live-field";
import {
  formatAnalystDate,
  pipelinePillForLead,
  scoreBarColor,
  sourcePillText,
} from "@/lib/analyst-ui";
import { filterLeadsByNameOrPhone } from "@/lib/lead-client-search";
import { useDebouncedLeadSearchUrl } from "@/lib/use-debounced-lead-search-url";

export type PipelineLeadRow = {
  id: string;
  leadName: string;
  phone: string | null;
  source: string;
  notes: string | null;
  qualificationStatus: string;
  salesStage: string;
  leadScore: number | null;
  createdAt: string;
};

export function AnalystPipelineTableClient({
  qualified,
  initialQ,
  from,
  to,
}: {
  qualified: PipelineLeadRow[];
  initialQ: string | null;
  from: string | null;
  to: string | null;
}) {
  const [query, setQuery] = useState(initialQ ?? "");
  useDebouncedLeadSearchUrl(query);

  const filtered = useMemo(
    () => filterLeadsByNameOrPhone(qualified, query),
    [qualified, query],
  );

  const hasQuery = query.trim().length > 0;

  return (
    <>
      <div className="rounded-2xl border border-slate-200 bg-gradient-to-b from-lf-elevated to-lf-bg px-4 py-4 shadow-sm sm:px-5 sm:py-5">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-lf-subtle">
          Find a client
        </p>
        <PortalLeadSearchLiveField value={query} onChange={setQuery} />
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-lf-surface">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="text-base font-semibold text-lf-text">
            All qualified leads — pipeline view
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] font-semibold uppercase tracking-wider text-lf-subtle">
                <th className="px-5 py-3 font-medium">Lead</th>
                <th className="px-5 py-3 font-medium">Source</th>
                <th className="px-5 py-3 font-medium">Your notes</th>
                <th className="px-5 py-3 font-medium">Score</th>
                <th className="px-5 py-3 font-medium">Pipeline</th>
                <th className="px-5 py-3 font-medium">Qualified on</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {qualified.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-12 text-center text-lf-subtle"
                  >
                    {from || to
                      ? "No qualified leads in this date range."
                      : "No qualified leads yet."}
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-12 text-center text-lf-subtle"
                  >
                    {hasQuery
                      ? "No qualified leads match this name or phone in the current filters."
                      : from || to
                        ? "No qualified leads in this date range."
                        : "No qualified leads yet."}
                  </td>
                </tr>
              ) : (
                filtered.map((l) => {
                  const pill = pipelinePillForLead(
                    l.qualificationStatus,
                    l.salesStage,
                  );
                  const s = l.leadScore;
                  return (
                    <tr key={l.id} className="text-lf-muted">
                      <td className="px-5 py-3 font-semibold text-lf-text">
                        {l.leadName || "—"}
                      </td>
                      <td className="px-5 py-3">
                        <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-lf-text-secondary">
                          {sourcePillText(l.source)}
                        </span>
                      </td>
                      <td className="px-5 py-3 align-top">
                        <AnalystNotesReadonly notes={l.notes} />
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-lf-bg">
                            <div
                              className={`h-full rounded-full ${scoreBarColor(s)}`}
                              style={{
                                width: `${s != null ? Math.min(100, s) : 0}%`,
                              }}
                            />
                          </div>
                          <span className="tabular-nums text-lf-text">
                            {s ?? "—"}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${pill.className}`}
                        >
                          {pill.label}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        {formatAnalystDate(new Date(l.createdAt))}
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
