"use client";

import { DashboardReportExport } from "@/components/dashboard-report-export";
import type { DashboardExportPayload } from "@/lib/dashboard-export-types";

export function SuperadminReportExport({
  payload,
}: {
  payload: DashboardExportPayload;
}) {
  return (
    <div
      className={
        // Scope to buttons inside the export control only (not any future fullscreen layers)
        "[&_[data-dashboard-export]_button]:border-slate-200 [&_[data-dashboard-export]_button]:bg-lf-bg [&_[data-dashboard-export]_button]:text-lf-text " +
        "[&_[data-dashboard-export]_button:hover]:bg-slate-100 [&_[data-dashboard-export]_[role=menu]]:border-slate-200 [&_[data-dashboard-export]_[role=menu]]:bg-lf-surface " +
        "[&_[data-dashboard-export]_[role=menuitem]]:text-lf-text [&_[data-dashboard-export]_[role=menuitem]:hover]:bg-slate-100"
      }
    >
      <DashboardReportExport payload={payload} />
    </div>
  );
}
