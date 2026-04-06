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

/** SQL fragment (no leading WHERE) + params for filtering "Lead" rows. */
export type SuperadminLeadsWhereSql = {
  /** Combined with AND; use `TRUE` when empty. */
  clause: string;
  params: unknown[];
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

/** Build SQL WHERE fragment for `Lead` (alias optional — use bare column names). */
export function buildSuperadminLeadsWhereSql(
  p: SuperadminLeadsParsed,
): SuperadminLeadsWhereSql {
  const parts: string[] = [];
  const params: unknown[] = [];
  let n = 1;

  const range = leadCreatedAtRange(p.from, p.to);

  if (p.dateBasis === "assigned") {
    parts.push(`"execAssignedAt" IS NOT NULL`);
    if (range) {
      parts.push(
        `"execAssignedAt" >= $${n}::timestamp AND "execAssignedAt" <= $${n + 1}::timestamp`,
      );
      params.push(range.gte, range.lte);
      n += 2;
    }
  } else if (range) {
    parts.push(
      `"createdAt" >= $${n}::timestamp AND "createdAt" <= $${n + 1}::timestamp`,
    );
    params.push(range.gte, range.lte);
    n += 2;
  }

  if (p.scope === "team" && p.teamId) {
    parts.push(`"teamId" = $${n}`);
    params.push(p.teamId);
    n += 1;
  }
  if (p.scope === "exec" && p.execId) {
    parts.push(`"assignedSalesExecId" = $${n}`);
    params.push(p.execId);
    n += 1;
  }

  return {
    clause: parts.length > 0 ? parts.join(" AND ") : "TRUE",
    params,
  };
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
