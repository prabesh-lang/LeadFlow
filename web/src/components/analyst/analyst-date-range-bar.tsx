"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";

function toYmd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
}

function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

type PresetId =
  | "all"
  | "7d"
  | "30d"
  | "90d"
  | "month"
  | "year"
  | "custom";

function CustomRangeForm({
  fromUrl,
  toUrl,
  onApply,
}: {
  fromUrl: string;
  toUrl: string;
  onApply: (from: string, to: string) => void;
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
    </form>
  );
}

export default function AnalystDateRangeBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const fromUrl = searchParams.get("from") ?? "";
  const toUrl = searchParams.get("to") ?? "";

  const pushQuery = useCallback(
    (from: string, to: string) => {
      const p = new URLSearchParams(searchParams.toString());
      if (from && to) {
        p.set("from", from);
        p.set("to", to);
      } else {
        p.delete("from");
        p.delete("to");
      }
      const q = p.toString();
      router.push(q ? `${pathname}?${q}` : pathname);
    },
    [pathname, router, searchParams],
  );

  const presetActive = useMemo((): PresetId => {
    if (!fromUrl && !toUrl) return "all";
    const today = startOfDay(new Date());
    const ymd = (d: Date) => toYmd(d);
    if (fromUrl === ymd(addDays(today, -6)) && toUrl === ymd(today)) return "7d";
    if (fromUrl === ymd(addDays(today, -29)) && toUrl === ymd(today))
      return "30d";
    if (fromUrl === ymd(addDays(today, -89)) && toUrl === ymd(today))
      return "90d";
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    if (fromUrl === ymd(monthStart) && toUrl === ymd(today)) return "month";
    const yearStart = new Date(today.getFullYear(), 0, 1);
    if (fromUrl === ymd(yearStart) && toUrl === ymd(today)) return "year";
    return "custom";
  }, [fromUrl, toUrl]);

  const applyPreset = (id: PresetId) => {
    const today = startOfDay(new Date());
    const ymd = (d: Date) => toYmd(d);
    switch (id) {
      case "all":
        pushQuery("", "");
        break;
      case "7d":
        pushQuery(ymd(addDays(today, -6)), ymd(today));
        break;
      case "30d":
        pushQuery(ymd(addDays(today, -29)), ymd(today));
        break;
      case "90d":
        pushQuery(ymd(addDays(today, -89)), ymd(today));
        break;
      case "month": {
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        pushQuery(ymd(monthStart), ymd(today));
        break;
      }
      case "year": {
        const yearStart = new Date(today.getFullYear(), 0, 1);
        pushQuery(ymd(yearStart), ymd(today));
        break;
      }
      default:
        break;
    }
  };

  const presetBtn = (id: PresetId, label: string) => (
    <button
      key={id}
      type="button"
      onClick={() => applyPreset(id)}
      className={`min-h-9 rounded-lg px-3 py-2 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
        presetActive === id
          ? "bg-lf-accent text-lf-on-accent shadow-sm shadow-[#c62828]/25 focus-visible:ring-lf-on-accent focus-visible:ring-offset-lf-accent"
          : "bg-lf-bg text-lf-muted ring-1 ring-lf-border hover:bg-lf-bg/50 hover:text-lf-text focus-visible:ring-lf-brand/35 focus-visible:ring-offset-lf-surface"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="rounded-2xl border border-lf-border bg-gradient-to-b from-lf-elevated to-lf-bg px-4 py-4 shadow-sm sm:px-5 sm:py-5">
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-3">
          <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-lf-subtle">
            <svg
              className="h-4 w-4 text-lf-accent/90"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            Filter by when the lead was added
          </span>
          <div className="flex flex-wrap gap-2">
            {presetBtn("all", "All time")}
            {presetBtn("7d", "7 days")}
            {presetBtn("30d", "30 days")}
            {presetBtn("90d", "90 days")}
            {presetBtn("month", "This month")}
            {presetBtn("year", "This year")}
          </div>
        </div>
        <div className="rounded-xl border border-lf-border bg-lf-bg/80 p-3 sm:p-4">
          <p className="mb-3 text-xs font-medium text-lf-subtle">
            Or pick exact dates
          </p>
          <CustomRangeForm
            key={`${fromUrl}\0${toUrl}`}
            fromUrl={fromUrl}
            toUrl={toUrl}
            onApply={pushQuery}
          />
        </div>
      </div>
      {(fromUrl || toUrl) && (
        <p className="mt-4 border-t border-lf-border pt-4 text-xs text-lf-subtle">
          Showing leads whose{" "}
          <span className="text-lf-muted">created date</span> is between{" "}
          <span className="font-medium text-lf-text-secondary">
            {fromUrl || "…"} → {toUrl || "…"}
          </span>
        </p>
      )}
    </div>
  );
}
