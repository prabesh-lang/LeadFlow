"use client";

import { useCallback, useState } from "react";
import type { DashboardExportPayload } from "@/lib/dashboard-export-types";
import {
  buildDashboardCsv,
  buildDashboardPdf,
  buildDashboardXlsx,
  exportFileBase,
} from "@/lib/dashboard-export-generators";

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function DashboardReportExport({
  payload,
}: {
  payload: DashboardExportPayload;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<"csv" | "xlsx" | "pdf" | null>(null);

  const base = exportFileBase(payload);

  const run = useCallback(
    (kind: "csv" | "xlsx" | "pdf") => {
      setBusy(kind);
      try {
        if (kind === "csv") {
          const csv = `\uFEFF${buildDashboardCsv(payload)}`;
          downloadBlob(
            new Blob([csv], { type: "text/csv;charset=utf-8" }),
            `${base}.csv`,
          );
        } else if (kind === "xlsx") {
          downloadBlob(buildDashboardXlsx(payload), `${base}.xlsx`);
        } else {
          downloadBlob(buildDashboardPdf(payload), `${base}.pdf`);
        }
      } finally {
        setBusy(null);
        setOpen(false);
      }
    },
    [payload, base],
  );

  return (
    <div className="relative" data-dashboard-export>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={busy !== null}
        className="inline-flex items-center gap-2 rounded-lg border border-lf-border bg-lf-bg px-3 py-2 text-sm font-medium text-lf-text shadow-sm hover:bg-lf-bg/50 disabled:opacity-60"
      >
        {busy ? (
          <span className="text-lf-muted">Exporting…</span>
        ) : (
          <>
            <svg
              className="h-4 w-4 text-lf-muted"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden
            >
              <path
                fillRule="evenodd"
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
            Export
          </>
        )}
      </button>
      {open && !busy ? (
        <>
          {/* Use a div, not a button: parent wrappers (e.g. superadmin) style all [&_button] and would paint this layer */}
          <div
            className="fixed inset-0 z-40 cursor-default bg-transparent"
            aria-hidden
            onClick={() => setOpen(false)}
          />
          <div
            role="menu"
            className="absolute right-0 top-full z-50 mt-1 min-w-[11rem] rounded-xl border border-lf-border bg-lf-surface py-1 shadow-xl"
          >
            <button
              type="button"
              role="menuitem"
              className="block w-full px-4 py-2.5 text-left text-sm text-lf-text hover:bg-lf-bg/50"
              onClick={() => run("pdf")}
            >
              PDF
            </button>
            <button
              type="button"
              role="menuitem"
              className="block w-full px-4 py-2.5 text-left text-sm text-lf-text hover:bg-lf-bg/50"
              onClick={() => run("xlsx")}
            >
              Excel (.xlsx)
            </button>
            <button
              type="button"
              role="menuitem"
              className="block w-full px-4 py-2.5 text-left text-sm text-lf-text hover:bg-lf-bg/50"
              onClick={() => run("csv")}
            >
              CSV
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}
