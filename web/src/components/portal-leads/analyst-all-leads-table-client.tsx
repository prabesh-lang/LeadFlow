"use client";

import { useMemo, useState } from "react";
import AnalystQualificationSelect from "@/components/analyst/analyst-qualification-select";
import AnalystNotesReadonly from "@/components/analyst-notes-readonly";
import ExecLostNotesReadonly from "@/components/exec-lost-notes-readonly";
import { PortalLeadSearchLiveField } from "@/components/portal-lead-search-live-field";
import { filterLeadsByNameOrPhone } from "@/lib/lead-client-search";
import { useDebouncedLeadSearchUrl } from "@/lib/use-debounced-lead-search-url";
import { formatAnalystDate, sourcePillText } from "@/lib/analyst-ui";
import { analystFacingSalesLabel } from "@/lib/sales-stage-labels";

export type AnalystAllLeadsRow = {
  id: string;
  leadName: string;
  phone: string | null;
  leadEmail: string | null;
  source: string;
  notes: string | null;
  lostNotes: string | null;
  qualificationStatus: string;
  leadScore: number | null;
  salesStage: string;
  createdAt: string;
};

export function AnalystAllLeadsTableClient({
  leads,
  initialQ,
  from,
  to,
}: {
  leads: AnalystAllLeadsRow[];
  initialQ: string | null;
  from: string | null;
  to: string | null;
}) {
  const [query, setQuery] = useState(initialQ ?? "");
  useDebouncedLeadSearchUrl(query);

  const filtered = useMemo(
    () => filterLeadsByNameOrPhone(leads, query),
    [leads, query],
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
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-lf-bg/50 text-[10px] font-semibold uppercase tracking-wider text-lf-subtle">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Phone</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Source</th>
                <th className="px-4 py-3 font-medium">Qualification</th>
                <th className="px-4 py-3 font-medium">Score</th>
                <th className="px-4 py-3 font-medium">Sales status</th>
                <th className="px-4 py-3 font-medium">Your notes</th>
                <th className="px-4 py-3 font-medium">Executive notes</th>
                <th className="px-4 py-3 font-medium">Added</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {leads.length === 0 ? (
                <tr>
                  <td
                    colSpan={10}
                    className="px-4 py-12 text-center text-lf-subtle"
                  >
                    {from || to
                      ? "No leads in this date range."
                      : "No leads yet."}
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={10}
                    className="px-4 py-12 text-center text-lf-subtle"
                  >
                    {hasQuery
                      ? "No leads match this name or phone in the current filters."
                      : from || to
                        ? "No leads in this date range."
                        : "No leads yet."}
                  </td>
                </tr>
              ) : (
                filtered.map((l) => (
                  <tr key={l.id} className="text-lf-muted">
                    <td className="px-4 py-3 font-semibold text-lf-text">
                      {l.leadName || "—"}
                    </td>
                    <td className="px-4 py-3">{l.phone || "—"}</td>
                    <td className="px-4 py-3">{l.leadEmail || "—"}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-xs text-lf-text-secondary">
                        {sourcePillText(l.source)}
                      </span>
                    </td>
                    <td className="px-4 py-3 align-middle">
                      <AnalystQualificationSelect
                        leadId={l.id}
                        value={l.qualificationStatus}
                      />
                    </td>
                    <td className="px-4 py-3 tabular-nums">
                      {l.leadScore ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-lf-text-secondary">
                      {analystFacingSalesLabel(l.salesStage)}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <AnalystNotesReadonly notes={l.notes} />
                    </td>
                    <td className="px-4 py-3 align-top">
                      <ExecLostNotesReadonly notes={l.lostNotes} />
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {formatAnalystDate(new Date(l.createdAt))}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
