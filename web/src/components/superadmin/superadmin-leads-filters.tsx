"use client";

import { usePathname } from "next/navigation";
import { useCallback, useState } from "react";
import { QualificationStatus } from "@/lib/constants";
import { normalizeYmdOrNull } from "@/lib/analyst-date-range";
import type { SuperadminLeadsParsed, SuperadminLeadsStatus } from "@/lib/superadmin-leads-filters";

type TeamOpt = { id: string; name: string };
type ExecOpt = { id: string; name: string; email: string };
type AnalystOpt = { id: string; name: string; email: string };

/**
 * Same navigation model as {@link AnalystDateRangeBar}: full `location.assign`
 * with merged query string so date filters always reach the server (matches
 * superadmin report + other portals).
 */
export function SuperadminLeadsFiltersBar({
  initial,
  analysts,
  teams,
  execs,
}: {
  initial: SuperadminLeadsParsed;
  analysts: AnalystOpt[];
  teams: TeamOpt[];
  execs: ExecOpt[];
}) {
  const pathname = usePathname();
  const [from, setFrom] = useState(initial.from ?? "");
  const [to, setTo] = useState(initial.to ?? "");
  const [status, setStatus] = useState<SuperadminLeadsStatus>(initial.status);
  const [analystId, setAnalystId] = useState(initial.analystId ?? "");
  const [teamId, setTeamId] = useState(initial.teamId ?? "");
  const [execId, setExecId] = useState(initial.execId ?? "");
  const [perPage, setPerPage] = useState<25 | 50 | 100>(initial.perPage);

  const apply = useCallback(() => {
    const p = new URLSearchParams(
      typeof window !== "undefined" ? window.location.search.slice(1) : "",
    );
    const setOrDel = (k: string, v: string) => {
      if (v) p.set(k, v);
      else p.delete(k);
    };

    let fromN = normalizeYmdOrNull(from.trim()) ?? "";
    let toN = normalizeYmdOrNull(to.trim()) ?? "";
    if (fromN && toN && fromN > toN) {
      const t = fromN;
      fromN = toN;
      toN = t;
    }
    setOrDel("from", fromN);
    setOrDel("to", toN);

    p.set("status", status);
    setOrDel("analystId", analystId.trim());
    setOrDel("teamId", teamId.trim());
    setOrDel("execId", execId.trim());
    p.set("perPage", String(perPage));
    p.set("page", "1");
    p.delete("dateBasis");
    p.delete("scope");

    const q = p.toString();
    window.location.assign(q ? `${pathname}?${q}` : pathname);
  }, [
    analystId,
    execId,
    from,
    pathname,
    perPage,
    status,
    teamId,
    to,
  ]);

  const reset = useCallback(() => {
    window.location.assign(pathname);
  }, [pathname]);

  return (
    <div className="rounded-xl border border-lf-border bg-lf-surface/90 p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-lf-subtle">
            Filters
          </p>
          <p className="mt-1 text-xs text-lf-subtle">Uses lead created time.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={apply}
            className="rounded-lg bg-lf-accent px-4 py-2 text-xs font-semibold text-lf-on-accent hover:bg-lf-accent-hover"
          >
            Apply
          </button>
          <button
            type="button"
            onClick={reset}
            className="rounded-lg border border-lf-border px-4 py-2 text-xs font-medium text-lf-text-secondary hover:bg-lf-bg/50"
          >
            Reset
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7">
        <label className="block text-xs font-medium text-lf-subtle">
          From
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="mt-1.5 block w-full min-h-10 rounded-lg border border-lf-border bg-lf-bg px-3 py-2 text-sm text-lf-text outline-none ring-lf-brand/35 focus:ring-2 [color-scheme:light]"
          />
        </label>
        <label className="block text-xs font-medium text-lf-subtle">
          To
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="mt-1.5 block w-full min-h-10 rounded-lg border border-lf-border bg-lf-bg px-3 py-2 text-sm text-lf-text outline-none ring-lf-brand/35 focus:ring-2 [color-scheme:light]"
          />
        </label>
        <label className="block text-xs font-medium text-lf-subtle">
          Lead status
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as SuperadminLeadsStatus)}
            className="mt-1.5 block w-full min-h-10 rounded-lg border border-lf-border bg-lf-bg px-3 py-2 text-sm text-lf-text outline-none ring-lf-brand/35 focus:ring-2"
          >
            <option value="ALL">All</option>
            <option value={QualificationStatus.QUALIFIED}>Qualified</option>
            <option value={QualificationStatus.NOT_QUALIFIED}>Not qualified</option>
            <option value={QualificationStatus.IRRELEVANT}>Irrelevant</option>
          </select>
        </label>
        <label className="block text-xs font-medium text-lf-subtle">
          Lead analyst
          <select
            value={analystId}
            onChange={(e) => setAnalystId(e.target.value)}
            className="mt-1.5 block w-full min-h-10 rounded-lg border border-lf-border bg-lf-bg px-3 py-2 text-sm text-lf-text outline-none ring-lf-brand/35 focus:ring-2"
          >
            <option value="">Select lead analyst…</option>
            {analysts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} ({a.email})
              </option>
            ))}
          </select>
        </label>
        <label className="block text-xs font-medium text-lf-subtle">
          Team
          <select
            value={teamId}
            onChange={(e) => setTeamId(e.target.value)}
            className="mt-1.5 block w-full min-h-10 rounded-lg border border-lf-border bg-lf-bg px-3 py-2 text-sm text-lf-text outline-none ring-lf-brand/35 focus:ring-2"
          >
            <option value="">Select team…</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-xs font-medium text-lf-subtle">
          Sales executive
          <select
            value={execId}
            onChange={(e) => setExecId(e.target.value)}
            className="mt-1.5 block w-full min-h-10 rounded-lg border border-lf-border bg-lf-bg px-3 py-2 text-sm text-lf-text outline-none ring-lf-brand/35 focus:ring-2"
          >
            <option value="">Select executive…</option>
            {execs.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name} ({e.email})
              </option>
            ))}
          </select>
        </label>
        <label className="block text-xs font-medium text-lf-subtle">
          Leads per page
          <select
            value={String(perPage)}
            onChange={(e) => {
              const v = Number.parseInt(e.target.value, 10);
              setPerPage(v === 50 || v === 100 ? v : 25);
            }}
            className="mt-1.5 block w-full min-h-10 rounded-lg border border-lf-border bg-lf-bg px-3 py-2 text-sm text-lf-text outline-none ring-lf-brand/35 focus:ring-2"
          >
            <option value="25">25</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </select>
        </label>
      </div>
    </div>
  );
}
