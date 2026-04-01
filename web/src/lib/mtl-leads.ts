import { leadCreatedAtRange } from "@/lib/analyst-date-range";

/** Leads routed to this main team lead, optionally filtered by lead `createdAt`. */
export function mtlLeadWhere(
  assignedMainTeamLeadId: string,
  from?: string | null,
  to?: string | null,
) {
  const range = leadCreatedAtRange(from, to);
  return {
    assignedMainTeamLeadId,
    ...(range ? { createdAt: range } : {}),
  };
}
