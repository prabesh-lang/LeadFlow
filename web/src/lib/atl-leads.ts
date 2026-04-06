import { leadCreatedAtRange } from "@/lib/analyst-date-range";

/** SQL WHERE for leads created by any of `analystIds` (optional `createdAt` range). */
export function atlLeadSql(
  analystIds: string[],
  from?: string | null,
  to?: string | null,
): { clause: string; params: unknown[] } {
  const range = leadCreatedAtRange(from, to);
  if (analystIds.length === 0) {
    return { clause: `FALSE`, params: [] };
  }
  if (!range) {
    return {
      clause: `"createdById" = ANY($1::text[])`,
      params: [analystIds],
    };
  }
  return {
    clause: `"createdById" = ANY($1::text[]) AND "createdAt" >= $2::timestamp AND "createdAt" <= $3::timestamp`,
    params: [analystIds, range.gte, range.lte],
  };
}
