import type { DashboardExportPayload } from "@/lib/dashboard-export-types";
import type { MtlLeadRow } from "@/lib/mtl-lead-row";

export function buildMtlLeadsExportPayload(
  rows: MtlLeadRow[],
  opts: { rangeLabel: string; searchQuery: string },
): DashboardExportPayload {
  const generatedAt = new Date().toISOString();
  const q = opts.searchQuery.trim();
  const summaryRows: { label: string; value: string | number }[] = [
    { label: "Leads in this export", value: rows.length },
    { label: "Date range", value: opts.rangeLabel },
  ];
  if (q) {
    summaryRows.push({ label: "Name or phone search", value: q });
  }

  const headers = [
    "Name",
    "Phone",
    "Email",
    "Source",
    "Analyst",
    "Score",
    "Stage",
    "Analyst notes",
    "Executive notes",
    "Rep",
    "Deadline",
  ];

  const tableRows: (string | number)[][] = rows.map((lead) => [
    lead.leadName || "—",
    lead.phone || "—",
    lead.leadEmail || "—",
    lead.source || "—",
    lead.createdBy.name,
    lead.leadScore ?? "—",
    lead.salesStage.replaceAll("_", " "),
    lead.notes ?? "—",
    lead.lostNotes ?? "—",
    lead.assignedSalesExec?.name ?? "—",
    lead.execDeadlineAt
      ? new Date(lead.execDeadlineAt).toLocaleString()
      : "—",
  ]);

  return {
    title: "All leads export",
    subtitle: "Main team lead · Qualified leads routed to your team",
    rangeLabel: opts.rangeLabel,
    generatedAt,
    fileNamePrefix: "leadflow-mtl-leads",
    summaryRows,
    tables: [{ title: "Leads", headers, rows: tableRows }],
  };
}
