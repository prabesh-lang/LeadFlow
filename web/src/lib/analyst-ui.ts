import {
  QualificationStatus,
  SalesStage,
} from "@/lib/constants";

export function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "??";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Short label for source pill (first segment or truncated). */
export function sourcePillText(source: string): string {
  const s = source.trim();
  if (!s) return "—";
  const beforeEnDash = s.split("—")[0]?.trim() ?? s;
  const beforeSlash = beforeEnDash.split("/")[0]?.trim() ?? beforeEnDash;
  if (beforeSlash.length <= 16) return beforeSlash;
  return `${beforeSlash.slice(0, 14)}…`;
}

export function scoreBarColor(score: number | null): string {
  if (score == null) return "bg-lf-muted";
  if (score >= 70) return "bg-lf-success";
  if (score >= 40) return "bg-lf-warning";
  return "bg-lf-danger";
}

export type PipelinePill = {
  label: string;
  className: string;
};

export function pipelinePillForLead(q: string, stage: string): PipelinePill {
  if (q !== QualificationStatus.QUALIFIED) {
    return { label: "—", className: "bg-white/5 text-lf-subtle" };
  }
  switch (stage) {
    case SalesStage.PRE_SALES:
      return {
        label: "Pending",
        className: "bg-white/10 text-lf-text-secondary",
      };
    case SalesStage.WITH_TEAM_LEAD:
      return {
        label: "Assigned",
        className:
          "bg-lf-warning/20 text-lf-warning ring-1 ring-lf-warning/40",
      };
    case SalesStage.WITH_EXECUTIVE:
      return {
        label: "In progress",
        className: "bg-lf-accent/20 text-lf-accent ring-1 ring-lf-accent/40",
      };
    case SalesStage.CLOSED_WON:
      return {
        label: "Closed won",
        className:
          "bg-lf-success/20 text-lf-success ring-1 ring-lf-success/40",
      };
    case SalesStage.CLOSED_LOST:
      return {
        label: "Closed lost",
        className: "bg-lf-danger/20 text-lf-danger ring-1 ring-lf-danger/40",
      };
    default:
      return { label: stage, className: "bg-white/5 text-lf-muted" };
  }
}

export function pipelineNoteForLead(
  q: string,
  stage: string,
  notes: string | null,
): string {
  if (notes?.trim()) return notes.trim();
  if (q !== QualificationStatus.QUALIFIED) return "—";
  switch (stage) {
    case SalesStage.PRE_SALES:
      return "Pending assignment";
    case SalesStage.WITH_TEAM_LEAD:
      return "Assigned to main team";
    case SalesStage.WITH_EXECUTIVE:
      return "In active discussion";
    case SalesStage.CLOSED_WON:
      return "Won";
    case SalesStage.CLOSED_LOST:
      return "Lost";
    default:
      return "—";
  }
}

export function formatAnalystDate(d: Date) {
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
