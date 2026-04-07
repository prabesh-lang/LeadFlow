"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { superadminDeleteLeadFormAction } from "@/app/actions/superadmin";
import { LeadHandoffAction, QualificationStatus } from "@/lib/constants";
import { analystFacingSalesLabel } from "@/lib/sales-stage-labels";
import { LeadSourceDisplay } from "@/components/lead-source-display";
import {
  superadminHandoffLabels,
  superadminRoleLabel,
} from "@/lib/superadmin-ui";

type JourneyLog = {
  id: string;
  createdAt: string;
  action: string;
  detail: string | null;
  actor: { name: string; email: string; role: string } | null;
};

type JourneyLead = {
  id: string;
  leadName: string;
  createdAt: string;
  qualificationStatus: string;
  source: string;
  salesStage: string;
  assignedMainTeamLead: { name: string; email: string } | null;
  team: { name: string } | null;
  assignedSalesExec: { name: string; email: string } | null;
  handoffLogs: JourneyLog[];
};

type AnalystGroup = {
  analyst: { id: string; name: string; email: string };
  leads: JourneyLead[];
};

function fmtDateTime(value: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString();
}

function statusPillClass(status: string) {
  if (status === QualificationStatus.QUALIFIED) {
    return "bg-lf-success/15 text-lf-success";
  }
  if (status === QualificationStatus.NOT_QUALIFIED) {
    return "bg-lf-warning/15 text-lf-warning";
  }
  return "bg-lf-bg/60 text-lf-text-secondary";
}

function fmtGap(fromIso: string | null, toIso: string | null) {
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
}

export function SuperadminLeadsJourneyClient({
  analystGroups,
}: {
  analystGroups: AnalystGroup[];
}) {
  const router = useRouter();
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [state, formAction, pending] = useActionState(
    superadminDeleteLeadFormAction,
    undefined,
  );
  const wasPending = useRef(false);

  const selected = useMemo(() => {
    if (!selectedLeadId) return null;
    for (const group of analystGroups) {
      const lead = group.leads.find((l) => l.id === selectedLeadId);
      if (lead) return { lead, analyst: group.analyst };
    }
    return null;
  }, [analystGroups, selectedLeadId]);

  const timeline = useMemo(() => {
    if (!selected) return null;
    let routedToMainTeamAt: string | null = null;
    let assignedToExecutiveAt: string | null = null;
    let directAssignedToExecutiveByAtlAt: string | null = null;
    for (const h of selected.lead.handoffLogs) {
      if (
        h.action === LeadHandoffAction.ROUTED_TO_MAIN_TEAM &&
        !routedToMainTeamAt
      ) {
        routedToMainTeamAt = h.createdAt;
      } else if (
        h.action === LeadHandoffAction.ASSIGNED_TO_EXECUTIVE &&
        !assignedToExecutiveAt
      ) {
        assignedToExecutiveAt = h.createdAt;
      } else if (
        h.action === LeadHandoffAction.DIRECT_ASSIGNED_TO_EXECUTIVE_BY_ATL &&
        !directAssignedToExecutiveByAtlAt
      ) {
        directAssignedToExecutiveByAtlAt = h.createdAt;
      }
    }
    return {
      routedToMainTeamAt,
      assignedToExecutiveAt,
      directAssignedToExecutiveByAtlAt,
    };
  }, [selected]);

  const closeModal = () => {
    if (pending) return;
    setSelectedLeadId(null);
  };

  useEffect(() => {
    if (wasPending.current && !pending && !state?.error) {
      setSelectedLeadId(null);
      router.refresh();
    }
    wasPending.current = pending;
  }, [pending, router, state]);

  const openLead = (leadId: string) => setSelectedLeadId(leadId);

  return (
    <>
      <div className="space-y-8">
        {analystGroups.map(({ analyst, leads }) => (
          <section key={analyst.id} className="space-y-4">
            <div className="border-b border-lf-border pb-2">
              <h2 className="text-lg font-semibold text-lf-text">{analyst.name}</h2>
              <p className="text-xs text-lf-subtle">{analyst.email}</p>
            </div>
            <div className="overflow-x-auto rounded-xl border border-lf-border bg-lf-surface/90">
              <table className="min-w-full divide-y divide-lf-border text-sm">
                <thead className="bg-lf-bg/50 text-left text-xs uppercase tracking-wide text-lf-subtle">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Lead</th>
                    <th className="px-4 py-3 font-semibold">Source</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Stage</th>
                    <th className="px-4 py-3 font-semibold">Team</th>
                    <th className="px-4 py-3 font-semibold">Sales executive</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-lf-border">
                  {leads.map((lead) => (
                    <tr
                      key={lead.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => openLead(lead.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          openLead(lead.id);
                        }
                      }}
                      className="cursor-pointer align-top text-lf-text-secondary transition hover:bg-lf-bg/35 focus:outline-none focus:ring-2 focus:ring-lf-brand/30"
                    >
                      <td className="px-4 py-3">
                        <p className="font-semibold text-lf-text">
                          {lead.leadName || "Unnamed lead"}
                        </p>
                        <p className="mt-1 text-xs text-lf-subtle">
                          Created {fmtDateTime(lead.createdAt)}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <LeadSourceDisplay source={lead.source} />
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${statusPillClass(
                            lead.qualificationStatus,
                          )}`}
                        >
                          {lead.qualificationStatus.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {analystFacingSalesLabel(lead.salesStage)}
                      </td>
                      <td className="px-4 py-3">{lead.team?.name ?? "—"}</td>
                      <td className="px-4 py-3">
                        {lead.assignedSalesExec?.name ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ))}
      </div>

      {selected ? (
        <div
          className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-black/70 p-4 pt-[5vh] backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="superadmin-lead-journey-title"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div
            className="w-full max-w-4xl rounded-2xl border border-lf-border bg-lf-surface p-6 shadow-2xl"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-3 border-b border-lf-border pb-4">
              <div>
                <h2
                  id="superadmin-lead-journey-title"
                  className="text-2xl font-semibold text-lf-text"
                >
                  {selected.lead.leadName || "Unnamed lead"}
                </h2>
                <p className="mt-1 text-sm text-lf-subtle">
                  Created {fmtDateTime(selected.lead.createdAt)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${statusPillClass(
                    selected.lead.qualificationStatus,
                  )}`}
                >
                  {selected.lead.qualificationStatus.replace(/_/g, " ")}
                </span>
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-lg p-1.5 text-lf-subtle hover:bg-lf-bg/50 hover:text-lf-text"
                  aria-label="Close"
                >
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <dl className="mb-6 grid gap-x-6 gap-y-2 text-sm text-lf-muted sm:grid-cols-[10rem_1fr]">
              <dt>Source</dt>
              <dd className="text-lf-text-secondary">
                <LeadSourceDisplay source={selected.lead.source} />
              </dd>
              <dt>Stage</dt>
              <dd className="text-lf-text-secondary">
                {analystFacingSalesLabel(selected.lead.salesStage)}
              </dd>
              <dt>Main team lead</dt>
              <dd className="text-lf-text-secondary">
                {selected.lead.assignedMainTeamLead?.name ?? "—"}
              </dd>
              <dt>Team</dt>
              <dd className="text-lf-text-secondary">
                {selected.lead.team?.name ?? "—"}
              </dd>
              <dt>Sales executive</dt>
              <dd className="text-lf-text-secondary">
                {selected.lead.assignedSalesExec?.name ?? "—"}
              </dd>
            </dl>

            <div className="border-t border-lf-border pt-4">
              {timeline ? (
                <div className="mb-4 rounded-lg border border-lf-border bg-lf-bg/40 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-lf-subtle">
                    Pass timeline / gap
                  </p>
                  <div className="mt-2 space-y-1 text-xs text-lf-text-secondary">
                    <p>
                      <span className="text-lf-subtle">Lead analyst: </span>
                      {fmtDateTime(selected.lead.createdAt)}
                    </p>
                    <p>
                      <span className="text-lf-subtle">ATL pass: </span>
                      {fmtDateTime(
                        timeline.directAssignedToExecutiveByAtlAt ??
                          timeline.routedToMainTeamAt,
                      )}
                    </p>
                    <p>
                      <span className="text-lf-subtle">Main TL pass: </span>
                      {timeline.directAssignedToExecutiveByAtlAt
                        ? "— (direct ATL→SE)"
                        : fmtDateTime(timeline.assignedToExecutiveAt)}
                    </p>
                    <p>
                      <span className="text-lf-subtle">Sales executive: </span>
                      {fmtDateTime(
                        timeline.assignedToExecutiveAt ??
                          timeline.directAssignedToExecutiveByAtlAt,
                      )}
                    </p>
                  </div>
                  <div className="mt-2 border-t border-lf-border pt-2 text-[11px] text-lf-muted">
                    <p>
                      LA → ATL:{" "}
                      {fmtGap(
                        selected.lead.createdAt,
                        timeline.directAssignedToExecutiveByAtlAt ??
                          timeline.routedToMainTeamAt,
                      )}
                    </p>
                    <p>
                      ATL → Main TL:{" "}
                      {timeline.directAssignedToExecutiveByAtlAt
                        ? "Skipped (direct ATL→SE)"
                        : "Instant at routing"}
                    </p>
                    <p>
                      Main TL → SE:{" "}
                      {timeline.directAssignedToExecutiveByAtlAt
                        ? "Direct by ATL"
                        : fmtGap(
                            timeline.routedToMainTeamAt,
                            timeline.assignedToExecutiveAt,
                          )}
                    </p>
                  </div>
                </div>
              ) : null}
              <p className="text-sm font-semibold uppercase tracking-wide text-lf-subtle">
                Journey
              </p>
              {selected.lead.handoffLogs.length === 0 ? (
                <p className="mt-2 text-sm text-lf-subtle">
                  No handoff events recorded (older leads or pre-log).
                </p>
              ) : (
                <ol className="mt-4 space-y-4">
                  {selected.lead.handoffLogs.map((h) => (
                    <li
                      key={h.id}
                      className="relative border-l border-lf-border pl-5 text-sm"
                    >
                      <span className="absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full bg-lf-muted" />
                      <p className="text-lf-subtle">{fmtDateTime(h.createdAt)}</p>
                      <p className="mt-0.5 font-semibold text-lf-text-secondary">
                        {superadminHandoffLabels[h.action] ?? h.action}
                      </p>
                      {h.actor ? (
                        <p className="mt-0.5 text-lf-subtle">
                          {h.actor.name} · {superadminRoleLabel(h.actor.role)}
                        </p>
                      ) : null}
                      {h.detail ? <p className="mt-1 text-lf-subtle">{h.detail}</p> : null}
                    </li>
                  ))}
                </ol>
              )}
            </div>

            <div className="mt-6 flex flex-col-reverse items-stretch justify-between gap-3 border-t border-lf-border pt-4 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg border border-lf-border px-4 py-2 text-sm font-medium text-lf-text-secondary hover:bg-lf-bg/60"
              >
                Close
              </button>
              <form
                action={formAction}
                onSubmit={(e) => {
                  const ok = window.confirm(
                    "Delete this lead permanently? This cannot be undone.",
                  );
                  if (!ok) e.preventDefault();
                }}
              >
                <input type="hidden" name="leadId" value={selected.lead.id} />
                <button
                  type="submit"
                  disabled={pending}
                  className="rounded-lg bg-lf-danger px-4 py-2 text-sm font-semibold text-white hover:bg-lf-danger/90 disabled:opacity-60"
                >
                  {pending ? "Deleting..." : "Delete lead"}
                </button>
                {state?.error ? (
                  <p className="mt-2 text-xs text-lf-danger" role="alert">
                    {state.error}
                  </p>
                ) : null}
              </form>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
