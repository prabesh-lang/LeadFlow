"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { startTransition, useState } from "react";
import { normalizeYmdOrNull } from "@/lib/analyst-date-range";

function DateRangeForm({
  fromUrl,
  toUrl,
  onApply,
  onClear,
  hasActiveRange,
}: {
  fromUrl: string;
  toUrl: string;
  onApply: (from: string, to: string) => void;
  onClear: () => void;
  hasActiveRange: boolean;
}) {
  const [customFrom, setCustomFrom] = useState(fromUrl);
  const [customTo, setCustomTo] = useState(toUrl);

  return (
    <form
      className="flex flex-wrap items-end gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (customFrom && customTo) {
          onApply(customFrom, customTo);
        }
      }}
    >
      <label className="text-xs font-medium text-lf-muted">
        From
        <input
          type="date"
          value={customFrom}
          onChange={(e) => setCustomFrom(e.target.value)}
          className="mt-1.5 block min-h-10 w-full min-w-[10rem] rounded-lg border border-lf-border bg-lf-bg px-3 py-2 text-sm text-lf-text outline-none ring-lf-brand/35 focus:border-lf-brand/50 focus:ring-2 focus:ring-lf-brand/25 [color-scheme:light]"
        />
      </label>
      <label className="text-xs font-medium text-lf-muted">
        To
        <input
          type="date"
          value={customTo}
          onChange={(e) => setCustomTo(e.target.value)}
          className="mt-1.5 block min-h-10 w-full min-w-[10rem] rounded-lg border border-lf-border bg-lf-bg px-3 py-2 text-sm text-lf-text outline-none ring-lf-brand/35 focus:border-lf-brand/50 focus:ring-2 focus:ring-lf-brand/25 [color-scheme:light]"
        />
      </label>
      <button
        type="submit"
        disabled={!customFrom || !customTo}
        className="min-h-10 rounded-lg bg-lf-accent px-4 text-xs font-semibold text-lf-on-accent shadow-sm transition hover:bg-lf-accent-hover disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lf-on-accent focus-visible:ring-offset-2 focus-visible:ring-offset-lf-accent"
      >
        Apply
      </button>
      {hasActiveRange ? (
        <button
          type="button"
          onClick={onClear}
          className="min-h-10 rounded-lg border border-lf-border px-4 text-xs font-medium text-lf-text-secondary hover:bg-lf-bg/50"
        >
          Clear
        </button>
      ) : null}
    </form>
  );
}

export default function AnalystDateRangeBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  // Only bind YYYY-MM-DD that pass the same checks as the server; invalid
  // query values break controlled <input type="date"> in some browsers/React.
  const fromUrl = normalizeYmdOrNull(searchParams.get("from")) ?? "";
  const toUrl = normalizeYmdOrNull(searchParams.get("to")) ?? "";

  const pushQuery = (from: string, to: string) => {
    const p = new URLSearchParams(searchParams.toString());
    let fromSafe = normalizeYmdOrNull(from);
    let toSafe = normalizeYmdOrNull(to);
    if (fromSafe && toSafe && fromSafe > toSafe) {
      const x = fromSafe;
      fromSafe = toSafe;
      toSafe = x;
    }
    if (fromSafe && toSafe) {
      p.set("from", fromSafe);
      p.set("to", toSafe);
      p.set("page", "1");
    } else {
      p.delete("from");
      p.delete("to");
      p.delete("page");
    }
    const q = p.toString();
    const href = q ? `${pathname}?${q}` : pathname;
    startTransition(() => {
      router.replace(href, { scroll: false });
    });
  };

  const clearRange = () => {
    pushQuery("", "");
  };

  const hasActiveRange = Boolean(fromUrl.trim() || toUrl.trim());

  return (
    <div className="rounded-2xl border border-lf-border bg-gradient-to-b from-lf-elevated to-lf-bg px-4 py-4 shadow-sm sm:px-5 sm:py-5">
      <DateRangeForm
        key={`${fromUrl}|${toUrl}`}
        fromUrl={fromUrl}
        toUrl={toUrl}
        onApply={pushQuery}
        onClear={clearRange}
        hasActiveRange={hasActiveRange}
      />
    </div>
  );
}
