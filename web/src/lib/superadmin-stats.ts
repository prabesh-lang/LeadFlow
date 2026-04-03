import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { QualificationStatus, SalesStage, UserRole } from "@/lib/constants";
import { leadCreatedAtRange } from "@/lib/analyst-date-range";
import { resolveLeadCity, resolveLeadCountry } from "@/lib/phone-location";

const ACTIVE_ROLES = [
  UserRole.LEAD_ANALYST,
  UserRole.ANALYST_TEAM_LEAD,
  UserRole.MAIN_TEAM_LEAD,
  UserRole.SALES_EXECUTIVE,
] as const;

export async function getSuperadminDashboardMetrics() {
  const [
    activeUsers,
    totalLeads,
    qualified,
    notQualified,
    irrelevant,
    teamGroups,
    execGroups,
  ] = await Promise.all([
    prisma.user.count({
      where: { role: { in: [...ACTIVE_ROLES] } },
    }),
    prisma.lead.count(),
    prisma.lead.count({
      where: { qualificationStatus: QualificationStatus.QUALIFIED },
    }),
    prisma.lead.count({
      where: { qualificationStatus: QualificationStatus.NOT_QUALIFIED },
    }),
    prisma.lead.count({
      where: { qualificationStatus: QualificationStatus.IRRELEVANT },
    }),
    prisma.lead.groupBy({
      by: ["teamId"],
      where: { teamId: { not: null } },
      _count: { id: true },
    }),
    prisma.lead.groupBy({
      by: ["assignedSalesExecId"],
      where: { assignedSalesExecId: { not: null } },
      _count: { id: true },
    }),
  ]);

  const teamIds = teamGroups
    .map((g) => g.teamId)
    .filter((id): id is string => id != null);
  const teams = await prisma.team.findMany({
    where: { id: { in: teamIds } },
    select: { id: true, name: true },
  });
  const teamName = new Map(teams.map((t) => [t.id, t.name]));

  const leadsByTeam = teamGroups.map((g) => ({
    teamId: g.teamId as string,
    teamName: g.teamId ? teamName.get(g.teamId) ?? "Unknown team" : "—",
    count: g._count.id,
  }));

  const execIds = execGroups
    .map((g) => g.assignedSalesExecId)
    .filter((id): id is string => id != null);
  const execs = await prisma.user.findMany({
    where: { id: { in: execIds } },
    select: { id: true, name: true, email: true },
  });
  const execLabel = new Map(
    execs.map((u) => [u.id, `${u.name} (${u.email})`]),
  );

  const leadsBySalesExec = execGroups.map((g) => ({
    salesExecId: g.assignedSalesExecId as string,
    label:
      execLabel.get(g.assignedSalesExecId as string) ?? "Unknown executive",
    count: g._count.id,
  }));

  return {
    activeUsers,
    totalLeads,
    qualified,
    notQualified,
    irrelevant,
    leadsByTeam,
    leadsBySalesExec,
  };
}

function monthKeyYmd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function scoreHistogramBucket(s: number | null | undefined): string {
  if (s == null || Number.isNaN(s)) return "No score";
  if (s <= 20) return "0–20";
  if (s <= 40) return "21–40";
  if (s <= 60) return "41–60";
  if (s <= 80) return "61–80";
  return "81–100";
}

const SCORE_HIST_ORDER = [
  "0–20",
  "21–40",
  "41–60",
  "61–80",
  "81–100",
  "No score",
] as const;

export async function getSuperadminReportAggregates(opts?: {
  from?: string | null;
  to?: string | null;
}) {
  const range = leadCreatedAtRange(
    opts?.from ?? undefined,
    opts?.to ?? undefined,
  );
  const leads = await prisma.lead.findMany({
    where: range ? { createdAt: range } : {},
    include: {
      createdBy: { select: { name: true } },
      assignedSalesExec: { select: { name: true } },
    },
  });

  let closedWon = 0;
  let closedLost = 0;
  let qualified = 0;
  let notQualified = 0;
  let irrelevant = 0;
  const byCountry = new Map<string, number>();
  const byCity = new Map<string, number>();
  const byScore = new Map<string, number>();
  const byMonth = new Map<string, number>();

  for (const l of leads) {
    if (l.qualificationStatus === QualificationStatus.QUALIFIED) qualified++;
    else if (l.qualificationStatus === QualificationStatus.NOT_QUALIFIED)
      notQualified++;
    else if (l.qualificationStatus === QualificationStatus.IRRELEVANT)
      irrelevant++;

    if (l.salesStage === SalesStage.CLOSED_WON) closedWon++;
    else if (l.salesStage === SalesStage.CLOSED_LOST) closedLost++;

    const c = resolveLeadCountry(l.country, l.phone);
    byCountry.set(c, (byCountry.get(c) ?? 0) + 1);

    const city = resolveLeadCity(l.city);
    const cityKey = `${city} · ${c}`;
    byCity.set(cityKey, (byCity.get(cityKey) ?? 0) + 1);

    const sb = scoreHistogramBucket(l.leadScore);
    byScore.set(sb, (byScore.get(sb) ?? 0) + 1);

    const mk = monthKeyYmd(l.createdAt);
    byMonth.set(mk, (byMonth.get(mk) ?? 0) + 1);
  }

  const total = leads.length;
  const closedTotal = closedWon + closedLost;

  const pct = (n: number) => (total > 0 ? (n / total) * 100 : 0);
  const pctClosed = (n: number) =>
    closedTotal > 0 ? (n / closedTotal) * 100 : 0;

  return {
    total,
    qualified,
    notQualified,
    irrelevant,
    closedWon,
    closedLost,
    qualifiedRatio: pct(qualified),
    notQualifiedRatio: pct(notQualified),
    irrelevantRatio: pct(irrelevant),
    /** Won as % of all leads */
    conversionRatio: pct(closedWon),
    /** Won as % of closed deals */
    winRateAmongClosed: pctClosed(closedWon),
    lostRateAmongClosed: pctClosed(closedLost),
    /** Lost as % of all leads (for funnel view) */
    lostRatioOfAll: pct(closedLost),
    countryRows: [...byCountry.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([country, count]) => ({ country, count })),
    cityRows: [...byCity.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([label, count]) => ({ label, count })),
    scoreHistogram: SCORE_HIST_ORDER.map((label) => ({
      label,
      count: byScore.get(label) ?? 0,
    })),
    createdByMonth: [...byMonth.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([ym, count]) => ({ label: ym, count })),
    countryHistogram: [...byCountry.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 16)
      .map(([country, count]) => ({ label: country, count })),
    /** Full rows for unified dashboard export (same format as other portals). */
    leads,
  };
}

export async function getSuperadminLeadsWithJourney(
  where?: Prisma.LeadWhereInput,
) {
  const leads = await prisma.lead.findMany({
    ...(where && Object.keys(where).length > 0 ? { where } : {}),
    orderBy: { updatedAt: "desc" },
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
      team: { select: { name: true } },
      assignedMainTeamLead: { select: { name: true, email: true } },
      assignedSalesExec: { select: { name: true, email: true } },
      handoffLogs: {
        orderBy: { createdAt: "asc" },
        include: {
          actor: { select: { name: true, email: true, role: true } },
        },
      },
    },
  });

  const qualTotals = {
    qualified: leads.filter(
      (l) => l.qualificationStatus === QualificationStatus.QUALIFIED,
    ).length,
    notQualified: leads.filter(
      (l) => l.qualificationStatus === QualificationStatus.NOT_QUALIFIED,
    ).length,
    irrelevant: leads.filter(
      (l) => l.qualificationStatus === QualificationStatus.IRRELEVANT,
    ).length,
  };

  const byAnalyst = new Map<string, typeof leads>();
  for (const l of leads) {
    const id = l.createdById;
    if (!byAnalyst.has(id)) byAnalyst.set(id, []);
    byAnalyst.get(id)!.push(l);
  }

  const analystGroups = [...byAnalyst.values()]
    .map((list) => ({
      analyst: list[0]!.createdBy,
      leads: list,
    }))
    .sort((a, b) => a.analyst.name.localeCompare(b.analyst.name));

  return { qualTotals, analystGroups };
}
