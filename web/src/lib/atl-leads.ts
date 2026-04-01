import { leadCreatedAtRange } from "@/lib/analyst-date-range";

/** Leads created by analysts reporting to this ATL, optionally filtered by createdAt. */
export function atlLeadWhere(
  analystIds: string[],
  from?: string | null,
  to?: string | null,
) {
  const range = leadCreatedAtRange(from, to);
  if (analystIds.length === 0) {
    return { id: { in: [] as string[] } };
  }
  return {
    createdById: { in: analystIds },
    ...(range ? { createdAt: range } : {}),
  };
}
