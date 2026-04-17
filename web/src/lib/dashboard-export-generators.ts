import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
// xlsx: used only to write workbooks from trusted in-memory data (no parsing of uploads).
import * as XLSX from "xlsx";
import type { DashboardExportPayload, DashboardExportTable } from "./dashboard-export-types";

function escapeCsvCell(value: string | number): string {
  const s = String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function csvRow(cells: (string | number)[]): string {
  return cells.map(escapeCsvCell).join(",");
}

function sanitizeSheetName(name: string, index: number): string {
  const cleaned = name.replace(/[\\/?*[\]]/g, "").trim().slice(0, 31);
  return cleaned || `Sheet${index + 1}`;
}

export function exportFileBase(payload: DashboardExportPayload): string {
  const gen = payload.generatedAt;
  const ymd =
    typeof gen === "string" && gen.length >= 10
      ? gen.slice(0, 10)
      : (() => {
          try {
            const d = gen != null ? new Date(gen as string) : new Date();
            const t = d.getTime();
            return Number.isNaN(t) ? "unknown" : d.toISOString().slice(0, 10);
          } catch {
            return "unknown";
          }
        })();
  const raw = String(payload.rangeLabel ?? "all time");
  const slug = raw
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .slice(0, 48);
  const prefix = String(payload.fileNamePrefix ?? "export").trim() || "export";
  return `${prefix}-${slug || "all-time"}-${ymd}`;
}

export function buildDashboardCsv(payload: DashboardExportPayload): string {
  const lines: string[] = [];
  lines.push(csvRow([payload.title]));
  lines.push(csvRow(["Subtitle", payload.subtitle]));
  lines.push(csvRow(["Range", payload.rangeLabel]));
  lines.push(csvRow(["Generated (UTC)", payload.generatedAt]));
  lines.push("");
  lines.push(csvRow(["=== Summary ==="]));
  lines.push(csvRow(["Metric", "Value"]));
  for (const r of payload.summaryRows) {
    lines.push(csvRow([r.label, r.value]));
  }
  for (const t of payload.tables) {
    lines.push("");
    lines.push(csvRow([`=== ${t.title} ===`]));
    lines.push(csvRow(t.headers));
    for (const row of t.rows) {
      lines.push(csvRow(row));
    }
  }
  return lines.join("\n");
}

export function buildDashboardXlsx(payload: DashboardExportPayload): Blob {
  const wb = XLSX.utils.book_new();

  const summaryAoA: (string | number)[][] = [
    [payload.title],
    [payload.subtitle],
    [`Range: ${payload.rangeLabel}`],
    [`Generated: ${payload.generatedAt}`],
    [],
    ["Metric", "Value"],
    ...payload.summaryRows.map((r) => [r.label, r.value]),
  ];
  const wsSummary = XLSX.utils.aoa_to_sheet(summaryAoA);
  XLSX.utils.book_append_sheet(wb, wsSummary, "Summary");

  payload.tables.forEach((t, i) => {
    const aoa = [t.headers, ...t.rows];
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    const name = sanitizeSheetName(`${i + 1}. ${t.title}`, i);
    XLSX.utils.book_append_sheet(wb, ws, name);
  });

  const out = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  return new Blob([out], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

type DocWithTable = jsPDF & {
  lastAutoTable?: { finalY: number };
};

function tableBodyOrPlaceholder(t: DashboardExportTable): string[][] {
  if (t.rows.length === 0) {
    return [
      t.headers.map((_, i) =>
        i === 0 ? "No data in range" : "—",
      ),
    ];
  }
  return t.rows.map((row) => row.map((c) => String(c)));
}

export function buildDashboardPdf(payload: DashboardExportPayload): Blob {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const margin = 14;
  let y = 16;

  doc.setFontSize(16);
  doc.text(payload.title, margin, y);
  y += 7;
  doc.setFontSize(10);
  const sub = `${payload.subtitle} · ${payload.rangeLabel}`;
  const subLines = doc.splitTextToSize(sub, 180);
  doc.text(subLines, margin, y);
  y += subLines.length * 5 + 4;
  doc.setFontSize(9);
  doc.text(
    `Generated: ${new Date(payload.generatedAt).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    })}`,
    margin,
    y,
  );
  y += 10;

  autoTable(doc, {
    startY: y,
    head: [["Metric", "Value"]],
    body: payload.summaryRows.map((r) => [r.label, String(r.value)]),
    styles: { fontSize: 9 },
    headStyles: { fillColor: [20, 23, 31] },
    margin: { left: margin, right: margin },
  });

  y = (doc as DocWithTable).lastAutoTable?.finalY ?? y;
  y += 10;

  for (const t of payload.tables) {
    if (y > 240) {
      doc.addPage();
      y = 20;
    }
    doc.setFontSize(11);
    const titleLines = doc.splitTextToSize(t.title, 180);
    doc.text(titleLines, margin, y);
    y += titleLines.length * 5 + 4;

    const fontSize = t.headers.length > 5 ? 7 : t.headers.length > 4 ? 8 : 9;
    autoTable(doc, {
      startY: y,
      head: [t.headers],
      body: tableBodyOrPlaceholder(t),
      styles: { fontSize, cellPadding: 1.5 },
      headStyles: { fillColor: [20, 23, 31] },
      margin: { left: margin, right: margin },
    });
    y = (doc as DocWithTable).lastAutoTable?.finalY ?? y;
    y += 10;
  }

  return doc.output("blob");
}
