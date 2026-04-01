import type { Prisma } from "@prisma/client";
import { leadCreatedAtRange } from "@/lib/analyst-date-range";

export type SuperadminLeadsScope = "all" | "team" | "exec";
export type SuperadminLeadsDateBasis = "created" | "assigned";

export type SuperadminLeadsParsed = {
  from: string | null;
  to: string | null;
  dateBasis: SuperadminLeadsDateBasis;
  scope: SuperadminLeadsScope;
  teamId: string | null;
  execId: string | null;
};

function first(
  v: string | string[] | undefined,
): string | undefined {
  if (Array.isArray(v)) return v[0];
  return v;
}

function trimOrNull(v: string | undefined): string | null {
  const t = v?.trim();
  return t ? t : null;
}

/** Parse Next.js `searchParams` for superadmin leads filters. */
export function parseSuperadminLeadsSearchParams(
  sp: Record<string, string | string[] | undefined>,
): SuperadminLeadsParsed {
  const dateBasis: SuperadminLeadsDateBasis =
    first(sp.dateBasis) === "assigned" ? "assigned" : "created";

  const scopeRaw = first(sp.scope);
  const scope: SuperadminLeadsScope =
    scopeRaw === "team" || scopeRaw === "exec" ? scopeRaw : "all";

  return {
    from: trimOrNull(first(sp.from)),
    to: trimOrNull(first(sp.to)),
    dateBasis,
    scope,
    teamId: trimOrNull(first(sp.teamId)),
    execId: trimOrNull(first(sp.execId)),
  };
}

export function buildSuperadminLeadsWhere(
  p: SuperadminLeadsParsed,
): Prisma.LeadWhereInput {
  const range = leadCreatedAtRange(p.from, p.to);
  const and: Prisma.LeadWhereInput[] = [];

  if (p.dateBasis === "assigned") {
    if (range) {
      and.push({
        execAssignedAt: {
          not: null,
          gte: range.gte,
          lte: range.lte,
        },
      });
    } else {
      and.push({ execAssignedAt: { not: null } });
    }
  } else if (range) {
    and.push({ createdAt: range });
  }

  if (p.scope === "team" && p.teamId) {
    and.push({ teamId: p.teamId });
  }
  if (p.scope === "exec" && p.execId) {
    and.push({ assignedSalesExecId: p.execId });
  }

  if (and.length === 0) return {};
  return { AND: and };
}

function fmtShort(d: Date) {
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function superadminLeadsFilterSummary(
  p: SuperadminLeadsParsed,
  opts: { teamName?: string | null; execLabel?: string | null },
): string {
  const range = leadCreatedAtRange(p.from, p.to);
  const rangeText = range
    ? `${fmtShort(range.gte)} – ${fmtShort(range.lte)}`
    : "All time";

  const basisText =
    p.dateBasis === "assigned"
      ? "Date = when assigned to sales exec"
      : "Date = when lead was created";

  let scopeText = "Everyone";
  if (p.scope === "team" && p.teamId) {
    scopeText = `Team: ${opts.teamName?.trim() || p.teamId}`;
  } else if (p.scope === "exec" && p.execId) {
    scopeText = `Sales executive: ${opts.execLabel?.trim() || p.execId}`;
  }

  return `${rangeText} · ${basisText} · ${scopeText}`;
}
