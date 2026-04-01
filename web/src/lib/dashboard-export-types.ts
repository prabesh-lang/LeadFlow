export type DashboardExportTable = {
  title: string;
  headers: string[];
  rows: (string | number)[][];
};

export type DashboardExportPayload = {
  title: string;
  subtitle: string;
  rangeLabel: string;
  generatedAt: string;
  fileNamePrefix: string;
  summaryRows: { label: string; value: string | number }[];
  tables: DashboardExportTable[];
};
