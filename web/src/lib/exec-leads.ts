import { leadCreatedAtRange } from "@/lib/analyst-date-range";

/** Leads assigned to this sales executive, optionally filtered by lead `createdAt`. */
export function execLeadWhere(
  assignedSalesExecId: string,
  from?: string | null,
  to?: string | null,
) {
  const range = leadCreatedAtRange(from, to);
  return {
    assignedSalesExecId,
    ...(range ? { createdAt: range } : {}),
  };
}
