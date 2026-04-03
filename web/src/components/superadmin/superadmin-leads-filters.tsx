"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import type {
  SuperadminLeadsDateBasis,
  SuperadminLeadsParsed,
  SuperadminLeadsScope,
} from "@/lib/superadmin-leads-filters";

type TeamOpt = { id: string; name: string };
type ExecOpt = { id: string; name: string; email: string };

export function SuperadminLeadsFiltersBar({
  initial,
  teams,
  execs,
}: {
  initial: SuperadminLeadsParsed;
  teams: TeamOpt[];
  execs: ExecOpt[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [from, setFrom] = useState(initial.from ?? "");
  const [to, setTo] = useState(initial.to ?? "");
  const [dateBasis, setDateBasis] = useState<SuperadminLeadsDateBasis>(
    initial.dateBasis,
  );
  const [scope, setScope] = useState<SuperadminLeadsScope>(initial.scope);
  const [teamId, setTeamId] = useState(initial.teamId ?? "");
  const [execId, setExecId] = useState(initial.execId ?? "");

  const apply = useCallback(() => {
    const p = new URLSearchParams(searchParams.toString());
    const setOrDel = (k: string, v: string) => {
      if (v) p.set(k, v);
      else p.delete(k);
    };

    setOrDel("from", from.trim());
    setOrDel("to", to.trim());
    p.set("dateBasis", dateBasis);
    p.set("scope", scope);

    if (scope === "team") {
      setOrDel("teamId", teamId.trim());
      p.delete("execId");
    } else if (scope === "exec") {
      setOrDel("execId", execId.trim());
      p.delete("teamId");
    } else {
      p.delete("teamId");
      p.delete("execId");
    }

    const q = p.toString();
    router.push(q ? `${pathname}?${q}` : pathname);
  }, [
    dateBasis,
    execId,
    from,
    pathname,
    router,
    scope,
    searchParams,
    teamId,
    to,
  ]);

  const reset = useCallback(() => {
    router.push(pathname);
  }, [pathname, router]);

  const teamDisabled = scope !== "team";
  const execDisabled = scope !== "exec";

  const summaryHint = useMemo(() => {
    if (dateBasis === "assigned") {
      return "Uses exec assignment time (leads not yet assigned to an exec are hidden when a date range is set).";
    }
    return "Uses lead created time.";
  }, [dateBasis]);

  return (
    <div className="rounded-xl border border-lf-border bg-lf-surface/90 p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-lf-subtle">
            Filters
          </p>
          <p className="mt-1 text-xs text-lf-subtle">{summaryHint}</p>
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

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
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
          Date applies to
          <select
            value={dateBasis}
            onChange={(e) =>
              setDateBasis(e.target.value as SuperadminLeadsDateBasis)
            }
            className="mt-1.5 block w-full min-h-10 rounded-lg border border-lf-border bg-lf-bg px-3 py-2 text-sm text-lf-text outline-none ring-lf-brand/35 focus:ring-2"
          >
            <option value="created">Lead created</option>
            <option value="assigned">Exec assigned</option>
          </select>
        </label>
        <label className="block text-xs font-medium text-lf-subtle">
          Filter mode
          <select
            value={scope}
            onChange={(e) => {
              const v = e.target.value as SuperadminLeadsScope;
              setScope(v);
              if (v !== "team") setTeamId("");
              if (v !== "exec") setExecId("");
            }}
            className="mt-1.5 block w-full min-h-10 rounded-lg border border-lf-border bg-lf-bg px-3 py-2 text-sm text-lf-text outline-none ring-lf-brand/35 focus:ring-2"
          >
            <option value="all">All leads</option>
            <option value="team">By sales team</option>
            <option value="exec">By sales executive</option>
          </select>
        </label>
        <label className="block text-xs font-medium text-lf-subtle">
          Team
          <select
            value={teamId}
            disabled={teamDisabled}
            onChange={(e) => setTeamId(e.target.value)}
            className="mt-1.5 block w-full min-h-10 rounded-lg border border-lf-border bg-lf-bg px-3 py-2 text-sm text-lf-text outline-none ring-lf-brand/35 focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50"
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
            disabled={execDisabled}
            onChange={(e) => setExecId(e.target.value)}
            className="mt-1.5 block w-full min-h-10 rounded-lg border border-lf-border bg-lf-bg px-3 py-2 text-sm text-lf-text outline-none ring-lf-brand/35 focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="">Select executive…</option>
            {execs.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name} ({e.email})
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}
