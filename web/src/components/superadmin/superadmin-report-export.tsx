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
        "[&_[data-dashboard-export]_button]:border-white/10 [&_[data-dashboard-export]_button]:bg-lf-bg [&_[data-dashboard-export]_button]:text-lf-text " +
        "[&_[data-dashboard-export]_button:hover]:bg-white/5 [&_[data-dashboard-export]_[role=menu]]:border-white/10 [&_[data-dashboard-export]_[role=menu]]:bg-lf-surface " +
        "[&_[data-dashboard-export]_[role=menuitem]]:text-lf-text [&_[data-dashboard-export]_[role=menuitem]:hover]:bg-white/5"
      }
    >
      <DashboardReportExport payload={payload} />
    </div>
  );
}
