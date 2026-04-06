import { normalizeClientSearchQuery } from "@/lib/lead-client-search";

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

function parseYmd(s: string): { y: number; m: number; d: number } | null {
  const m = s.trim().match(ISO_DATE);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;
  return { y, m: mo, d };
}

function endOfToday(): Date {
  const now = new Date();
  return new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    23,
    59,
    59,
    999,
  );
}

/** Inclusive filtering on `createdAt` (local dates). */
export function leadCreatedAtRange(
  fromStr?: string | null,
  toStr?: string | null,
): { gte: Date; lte: Date } | undefined {
  const from = fromStr?.trim();
  const to = toStr?.trim();
  if (!from && !to) return undefined;

  if (from && !to) {
    const p = parseYmd(from);
    if (!p) return undefined;
    const gte = new Date(p.y, p.m - 1, p.d, 0, 0, 0, 0);
    return { gte, lte: endOfToday() };
  }

  if (!from && to) {
    const p = parseYmd(to);
    if (!p) return undefined;
    const lte = new Date(p.y, p.m - 1, p.d, 23, 59, 59, 999);
    return { gte: new Date(0), lte };
  }

  const sf = parseYmd(from!);
  const st = parseYmd(to!);
  if (!sf || !st) return undefined;
  const gte = new Date(sf.y, sf.m - 1, sf.d, 0, 0, 0, 0);
  const lte = new Date(st.y, st.m - 1, st.d, 23, 59, 59, 999);
  if (gte > lte) return { gte: lte, lte: gte };
  return { gte, lte };
}

/** SQL WHERE fragment + params for leads owned by `createdById` (optional date on `createdAt`). */
export function leadWhereSql(
  createdById: string,
  fromStr?: string | null,
  toStr?: string | null,
): { clause: string; params: unknown[] } {
  const range = leadCreatedAtRange(fromStr, toStr);
  if (!range) {
    return { clause: `"createdById" = $1`, params: [createdById] };
  }
  return {
    clause: `"createdById" = $1 AND "createdAt" >= $2::timestamp AND "createdAt" <= $3::timestamp`,
    params: [createdById, range.gte, range.lte],
  };
}

export function analystRangeSummaryLabel(
  fromStr?: string | null,
  toStr?: string | null,
): string {
  const range = leadCreatedAtRange(fromStr, toStr);
  if (!range) return "All time";
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  return `${fmt(range.gte)} – ${fmt(range.lte)}`;
}

export function hrefWithDateRange(
  path: string,
  fromStr?: string | null,
  toStr?: string | null,
  qStr?: string | null,
): string {
  const from = fromStr?.trim();
  const to = toStr?.trim();
  const q = normalizeClientSearchQuery(qStr ?? null);
  if (!from && !to && !q) return path;
  const params = new URLSearchParams();
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  if (q) params.set("q", q);
  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
}

/** Next.js app router `searchParams` (may be a Promise in newer versions). */
export async function analystRangeParams(
  searchParams:
    | Promise<{ from?: string; to?: string; q?: string }>
    | { from?: string; to?: string; q?: string },
): Promise<{ from: string | null; to: string | null; q: string | null }> {
  const sp = await Promise.resolve(searchParams);
  return {
    from: sp.from?.trim() || null,
    to: sp.to?.trim() || null,
    q: normalizeClientSearchQuery(sp.q),
  };
}
