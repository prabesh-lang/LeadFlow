"use client";

import { type FormEvent } from "react";
import { normalizeYmdOrNull } from "@/lib/analyst-date-range";

export type AnalystDateRangeBarProps = {
  /** Current route pathname, e.g. `/analyst-team-lead` */
  pathname: string;
  defaultFrom: string;
  defaultTo: string;
  /** Params to preserve (e.g. `q`, `perPage`) — excludes from/to/page. */
  preservedEntries: [string, string][];
};

/**
 * Date range filter for portal dashboards and lead lists.
 *
 * Apply/Clear use `window.location.assign` so navigation is always a **full
 * document load** with the correct query string. The App Router can intercept
 * plain GET `<form>` submits and soft-navigate in ways that drop or mishandle
 * `?from=` / `?to=`, which breaks ATL and other portals after Apply.
 */
export default function AnalystDateRangeBar({
  pathname,
  defaultFrom,
  defaultTo,
  preservedEntries,
}: AnalystDateRangeBarProps) {
  const hasActiveRange = Boolean(
    (defaultFrom ?? "").trim() || (defaultTo ?? "").trim(),
  );

  function appendPreserved(params: URLSearchParams) {
    for (const [k, v] of preservedEntries) {
      if (k === "from" || k === "to" || k === "page") continue;
      params.append(k, String(v));
    }
  }

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    let fromSafe = normalizeYmdOrNull(String(fd.get("from") ?? ""));
    let toSafe = normalizeYmdOrNull(String(fd.get("to") ?? ""));
    if (!fromSafe || !toSafe) return;
    if (fromSafe > toSafe) {
      const tmp = fromSafe;
      fromSafe = toSafe;
      toSafe = tmp;
    }
    const p = new URLSearchParams();
    appendPreserved(p);
    p.set("from", fromSafe);
    p.set("to", toSafe);
    p.set("page", "1");
    const qs = p.toString();
    const href = qs ? `${pathname}?${qs}` : pathname;
    window.location.assign(href);
  }

  function onClear() {
    const p = new URLSearchParams();
    appendPreserved(p);
    const qs = p.toString();
    const href = qs ? `${pathname}?${qs}` : pathname;
    window.location.assign(href);
  }

  return (
    <div className="rounded-2xl border border-lf-border bg-gradient-to-b from-lf-elevated to-lf-bg px-4 py-4 shadow-sm sm:px-5 sm:py-5">
      <div className="flex flex-wrap items-end gap-3">
        <form
          key={`${defaultFrom}|${defaultTo}`}
          onSubmit={onSubmit}
          className="flex flex-wrap items-end gap-3"
        >
          {preservedEntries.map(([k, v], i) => (
            <input
              key={`${i}-${k}`}
              type="hidden"
              name={k}
              value={String(v)}
              aria-hidden
            />
          ))}
          <input type="hidden" name="page" value="1" aria-hidden />
          <label className="text-xs font-medium text-lf-muted">
            From
            <input
              type="date"
              name="from"
              required
              defaultValue={defaultFrom}
              className="mt-1.5 block min-h-10 w-full min-w-[10rem] rounded-lg border border-lf-border bg-lf-bg px-3 py-2 text-sm text-lf-text outline-none ring-lf-brand/35 focus:border-lf-brand/50 focus:ring-2 focus:ring-lf-brand/25 [color-scheme:light]"
            />
          </label>
          <label className="text-xs font-medium text-lf-muted">
            To
            <input
              type="date"
              name="to"
              required
              defaultValue={defaultTo}
              className="mt-1.5 block min-h-10 w-full min-w-[10rem] rounded-lg border border-lf-border bg-lf-bg px-3 py-2 text-sm text-lf-text outline-none ring-lf-brand/35 focus:border-lf-brand/50 focus:ring-2 focus:ring-lf-brand/25 [color-scheme:light]"
            />
          </label>
          <button
            type="submit"
            className="min-h-10 rounded-lg bg-lf-accent px-4 text-xs font-semibold text-lf-on-accent shadow-sm transition hover:bg-lf-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lf-on-accent focus-visible:ring-offset-2 focus-visible:ring-offset-lf-accent"
          >
            Apply
          </button>
        </form>
        {hasActiveRange ? (
          <button
            type="button"
            onClick={onClear}
            className="min-h-10 rounded-lg border border-lf-border px-4 text-xs font-medium text-lf-text-secondary hover:bg-lf-bg/50"
          >
            Clear
          </button>
        ) : null}
      </div>
    </div>
  );
}
