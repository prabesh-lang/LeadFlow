"use client";

import { formatLeadSourceDisplay } from "@/lib/lead-sources";

/** Plain text; truncates with full value in `title` for long sources. */
export function LeadSourceDisplay({ source }: { source: string }) {
  const s = formatLeadSourceDisplay(source);
  return (
    <span
      className="inline-block max-w-[min(100%,22rem)] truncate align-top"
      title={s}
    >
      {s}
    </span>
  );
}

/** Compact pill for tables and reports. */
export function LeadSourcePill({ source }: { source: string }) {
  const s = formatLeadSourceDisplay(source);
  return (
    <span
      className="inline-flex max-w-[min(100%,22rem)] truncate rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-lf-text-secondary"
      title={s}
    >
      {s}
    </span>
  );
}
