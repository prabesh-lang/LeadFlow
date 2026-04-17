"use client";

import { type FormEvent } from "react";
import {
  buildPortalDateRangeApplyHref,
  buildPortalDateRangeClearHref,
  normalizeYmdOrNull,
} from "@/lib/analyst-date-range";

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
 * Apply/Clear use `window.location.assign` with {@link buildPortalDateRangeApplyHref}
 * so navigation matches superadmin and always sends a full document request with
 * `?from=` / `?to=` / `page=1` plus preserved params.
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
    window.location.assign(
      buildPortalDateRangeApplyHref(pathname, fromSafe, toSafe, preservedEntries),
    );
  }

  function onClear() {
    window.location.assign(buildPortalDateRangeClearHref(pathname, preservedEntries));
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
