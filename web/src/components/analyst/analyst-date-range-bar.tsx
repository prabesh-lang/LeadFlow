"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useCallback, type FormEvent } from "react";
import { normalizeYmdOrNull } from "@/lib/analyst-date-range";

/** Copy query params except date-range keys (used for Apply + Clear). */
function preservedSearchParamEntries(
  searchParams: ReturnType<typeof useSearchParams>,
): [string, string][] {
  const out: [string, string][] = [];
  const skip = new Set(["from", "to", "page"]);
  searchParams.forEach((value, key) => {
    if (!skip.has(key)) out.push([key, value]);
  });
  return out;
}

function buildClearHref(
  pathname: string,
  searchParams: ReturnType<typeof useSearchParams>,
): string {
  const p = new URLSearchParams();
  for (const [k, v] of preservedSearchParamEntries(searchParams)) {
    p.append(k, v);
  }
  const q = p.toString();
  return q ? `${pathname}?${q}` : pathname;
}

/**
 * Uses `window.location.assign` for Apply / Clear so navigation is a full
 * document load. This avoids Next.js App Router 16.2.x soft-navigation issues
 * with `router.push` / `router.replace` and cached `useSearchParams` state.
 */
export default function AnalystDateRangeBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const fromUrl = normalizeYmdOrNull(searchParams.get("from")) ?? "";
  const toUrl = normalizeYmdOrNull(searchParams.get("to")) ?? "";
  const hasActiveRange = Boolean(fromUrl.trim() || toUrl.trim());
  const clearHref = buildClearHref(pathname, searchParams);

  const onSubmit = useCallback(
    (e: FormEvent<HTMLFormElement>) => {
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
      for (const [k, v] of preservedSearchParamEntries(searchParams)) {
        p.append(k, v);
      }
      p.set("from", fromSafe);
      p.set("to", toSafe);
      p.set("page", "1");
      const q = p.toString();
      const href = q ? `${pathname}?${q}` : pathname;
      window.location.assign(href);
    },
    [pathname, searchParams],
  );

  const onClear = useCallback(() => {
    window.location.assign(clearHref);
  }, [clearHref]);

  return (
    <div className="rounded-2xl border border-lf-border bg-gradient-to-b from-lf-elevated to-lf-bg px-4 py-4 shadow-sm sm:px-5 sm:py-5">
      <div className="flex flex-wrap items-end gap-3">
        <form
          key={`${fromUrl}|${toUrl}`}
          onSubmit={onSubmit}
          className="flex flex-wrap items-end gap-3"
        >
          <label className="text-xs font-medium text-lf-muted">
            From
            <input
              type="date"
              name="from"
              required
              defaultValue={fromUrl}
              className="mt-1.5 block min-h-10 w-full min-w-[10rem] rounded-lg border border-lf-border bg-lf-bg px-3 py-2 text-sm text-lf-text outline-none ring-lf-brand/35 focus:border-lf-brand/50 focus:ring-2 focus:ring-lf-brand/25 [color-scheme:light]"
            />
          </label>
          <label className="text-xs font-medium text-lf-muted">
            To
            <input
              type="date"
              name="to"
              required
              defaultValue={toUrl}
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
