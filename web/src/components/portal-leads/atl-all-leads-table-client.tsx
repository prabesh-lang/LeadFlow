"use client";

import { useMemo, useState } from "react";
import { AssignToMtlForm } from "@/components/atl/assign-to-mtl-form";
import { AssignDirectToExecForm } from "@/components/atl/assign-direct-to-exec-form";
import AnalystNotesReadonly from "@/components/analyst-notes-readonly";
import ExecLostNotesReadonly from "@/components/exec-lost-notes-readonly";
import { PortalLeadSearchLiveField } from "@/components/portal-lead-search-live-field";
import { QualificationStatus, SalesStage } from "@/lib/constants";
import { filterLeadsByNameOrPhone } from "@/lib/lead-client-search";
import { useDebouncedLeadSearchUrl } from "@/lib/use-debounced-lead-search-url";
import { LeadSourcePill } from "@/components/lead-source-display";
import { formatAnalystDate } from "@/lib/analyst-ui";
import { analystFacingSalesLabel } from "@/lib/sales-stage-labels";

export type AtlLeadRow = {
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
  teamId: string | null;
  assignedMainTeamLeadId: string | null;
  createdBy: { name: string };
  team: { name: string } | null;
  assignedMainTeamLead: { name: string } | null;
  assignedSalesExec: { name: string } | null;
  routedToMainTeamAt: string | null;
  assignedToExecutiveAt: string | null;
  directAssignedToExecutiveByAtlAt: string | null;
};

export type MtlOption = {
  id: string;
  name: string;
  teamId: string;
  teamName: string;
};
export type ExecOption = {
  id: string;
  name: string;
  email: string;
  teamId: string;
};

export function AtlAllLeadsTableClient({
  leads,
  initialQ,
  from,
  to,
  analystIdsEmpty,
  mtlOptions,
  execOptions,
}: {
  leads: AtlLeadRow[];
  initialQ: string | null;
  from: string | null;
  to: string | null;
  analystIdsEmpty: boolean;
  mtlOptions: MtlOption[];
  execOptions: ExecOption[];
}) {
  const [query, setQuery] = useState(initialQ ?? "");
  useDebouncedLeadSearchUrl(query);

  const filtered = useMemo(
    () => filterLeadsByNameOrPhone(leads, query),
    [leads, query],
  );

  const hasQuery = query.trim().length > 0;

  const fmtDateTime = (iso: string | null) => {
    if (!iso) return "—";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleString();
  };

  const fmtGap = (fromIso: string | null, toIso: string | null) => {
    if (!fromIso || !toIso) return "—";
    const from = new Date(fromIso).getTime();
    const to = new Date(toIso).getTime();
    if (!Number.isFinite(from) || !Number.isFinite(to) || to < from) return "—";
    const mins = Math.floor((to - from) / 60000);
    const days = Math.floor(mins / (60 * 24));
    const hours = Math.floor((mins % (60 * 24)) / 60);
    const minutes = mins % 60;
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  return (
    <>
      <div className="rounded-2xl border border-lf-border bg-gradient-to-b from-lf-elevated to-lf-bg px-4 py-4 shadow-sm sm:px-5 sm:py-5">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-lf-subtle">
          Find a client
        </p>
        <PortalLeadSearchLiveField value={query} onChange={setQuery} />
      </div>

      <div className="overflow-hidden rounded-2xl border border-lf-border bg-lf-surface">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1040px] text-left text-sm">
            <thead>
              <tr className="border-b border-lf-border bg-lf-bg/50 text-[10px] font-semibold uppercase tracking-wider text-lf-subtle">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Analyst</th>
                <th className="px-4 py-3 font-medium">Phone</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Source</th>
                <th className="px-4 py-3 font-medium">Analyst notes</th>
                <th className="px-4 py-3 font-medium">Qualification</th>
                <th className="px-4 py-3 font-medium">Score</th>
                <th className="px-4 py-3 font-medium">Sales status</th>
                <th className="px-4 py-3 font-medium">Executive notes</th>
                <th className="px-4 py-3 font-medium">Added</th>
                <th className="px-4 py-3 font-medium">Route TL</th>
                <th className="px-4 py-3 font-medium">Route SE</th>
                <th className="px-4 py-3 font-medium">Pass timeline / gap</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-lf-divide">
              {leads.length === 0 ? (
                <tr>
                  <td
                    colSpan={14}
                    className="px-4 py-12 text-center text-lf-subtle"
                  >
                    {from || to
                      ? "No leads in this date range."
                      : analystIdsEmpty
                        ? "Add lead analysts under Members."
                        : "No leads yet from your team."}
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={14}
                    className="px-4 py-12 text-center text-lf-subtle"
                  >
                    {hasQuery
                      ? "No leads match this name or phone in the current filters."
                      : from || to
                        ? "No leads in this date range."
                        : analystIdsEmpty
                          ? "Add lead analysts under Members."
                          : "No leads yet from your team."}
                  </td>
                </tr>
              ) : (
                filtered.map((l) => {
                  const canAssign =
                    l.qualificationStatus === QualificationStatus.QUALIFIED &&
                    l.salesStage === SalesStage.PRE_SALES &&
                    mtlOptions.length > 0;
                  const canDirectAssign = canAssign && execOptions.length > 0;
                  const hasMainRoute =
                    Boolean(l.teamId || l.assignedMainTeamLeadId);
                  const teamLabel = l.team?.name ?? null;
                  const tlName = l.assignedMainTeamLead?.name ?? null;
                  const routeTlDisplay =
                    hasMainRoute && (teamLabel || tlName) ? (
                      <div className="max-w-[220px] space-y-0.5 text-xs text-lf-text-secondary">
                        {teamLabel ? (
                          <p>
                            <span className="text-lf-subtle">Team </span>
                            <span className="font-medium text-lf-text">
                              {teamLabel}
                            </span>
                          </p>
                        ) : null}
                        {tlName ? (
                          <p>
                            <span className="text-lf-subtle">TL </span>
                            <span className="font-medium text-lf-text">
                              {tlName}
                            </span>
                          </p>
                        ) : null}
                      </div>
                    ) : null;
                  return (
                    <tr key={l.id} className="text-lf-muted">
                      <td className="px-4 py-3 font-semibold text-lf-text">
                        {l.leadName || "—"}
                      </td>
                      <td className="px-4 py-3">{l.createdBy.name}</td>
                      <td className="px-4 py-3">{l.phone || "—"}</td>
                      <td className="px-4 py-3">{l.leadEmail || "—"}</td>
                      <td className="px-4 py-3">
                        <LeadSourcePill source={l.source} />
                      </td>
                      <td className="px-4 py-3 align-top">
                        <AnalystNotesReadonly notes={l.notes} />
                      </td>
                      <td className="px-4 py-3">
                        {l.qualificationStatus.replaceAll("_", " ")}
                      </td>
                      <td className="px-4 py-3 tabular-nums">
                        {l.leadScore ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-lf-text-secondary">
                        {analystFacingSalesLabel(l.salesStage)}
                      </td>
                      <td className="px-4 py-3 align-top">
                        <ExecLostNotesReadonly notes={l.lostNotes} />
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {formatAnalystDate(new Date(l.createdAt))}
                      </td>
                      <td className="px-4 py-3 align-top">
                        {canAssign ? (
                          <AssignToMtlForm
                            leadId={l.id}
                            mainTeamLeads={mtlOptions}
                          />
                        ) : routeTlDisplay ? (
                          routeTlDisplay
                        ) : l.qualificationStatus ===
                          QualificationStatus.NOT_QUALIFIED ? (
                          <span className="text-xs text-lf-warning">
                            Not qualified — cannot route to main team
                          </span>
                        ) : l.qualificationStatus ===
                          QualificationStatus.IRRELEVANT ? (
                          <span className="text-xs text-lf-subtle">
                            Irrelevant — cannot route to main team
                          </span>
                        ) : l.qualificationStatus ===
                            QualificationStatus.QUALIFIED &&
                          l.salesStage === SalesStage.PRE_SALES &&
                          mtlOptions.length === 0 ? (
                          <span className="text-xs text-lf-subtle">
                            Add a main team lead under Members
                          </span>
                        ) : (
                          <span className="text-xs text-lf-subtle">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 align-top text-xs text-lf-text-secondary">
                        {canDirectAssign ? (
                          <AssignDirectToExecForm
                            leadId={l.id}
                            mainTeamLeads={mtlOptions}
                            execOptions={execOptions}
                          />
                        ) : l.assignedSalesExec ? (
                          <span className="font-medium text-lf-text">
                            {l.assignedSalesExec.name}
                          </span>
                        ) : l.qualificationStatus ===
                            QualificationStatus.QUALIFIED &&
                          l.salesStage === SalesStage.PRE_SALES &&
                          mtlOptions.length > 0 &&
                          execOptions.length === 0 ? (
                          <span className="text-lf-subtle">
                            Add sales executives under Team
                          </span>
                        ) : (
                          <span className="text-lf-subtle">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 align-top">
                        <div className="min-w-[260px] space-y-1 text-xs text-lf-text-secondary">
                          <p>
                            <span className="text-lf-subtle">Lead analyst: </span>
                            {fmtDateTime(l.createdAt)}
                          </p>
                          <p>
                            <span className="text-lf-subtle">ATL pass: </span>
                            {fmtDateTime(
                              l.directAssignedToExecutiveByAtlAt ??
                                l.routedToMainTeamAt,
                            )}
                          </p>
                          <p>
                            <span className="text-lf-subtle">Main TL pass: </span>
                            {l.directAssignedToExecutiveByAtlAt
                              ? "— (direct ATL→SE)"
                              : fmtDateTime(l.assignedToExecutiveAt)}
                          </p>
                          <p>
                            <span className="text-lf-subtle">Sales executive: </span>
                            {fmtDateTime(
                              l.assignedToExecutiveAt ??
                                l.directAssignedToExecutiveByAtlAt,
                            )}
                          </p>
                          <div className="mt-1 border-t border-lf-border pt-1 text-[11px] text-lf-muted">
                            <p>
                              LA → ATL:{" "}
                              {fmtGap(
                                l.createdAt,
                                l.directAssignedToExecutiveByAtlAt ??
                                  l.routedToMainTeamAt,
                              )}
                            </p>
                            <p>
                              ATL → Main TL:{" "}
                              {l.directAssignedToExecutiveByAtlAt
                                ? "Skipped (direct ATL→SE)"
                                : "Instant at routing"}
                            </p>
                            <p>
                              Main TL → SE:{" "}
                              {l.directAssignedToExecutiveByAtlAt
                                ? "Direct by ATL"
                                : fmtGap(l.routedToMainTeamAt, l.assignedToExecutiveAt)}
                            </p>
                          </div>
                        </div>
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
