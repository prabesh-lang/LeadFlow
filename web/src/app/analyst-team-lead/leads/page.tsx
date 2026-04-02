import Link from "next/link";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import AnalystDateRangeBarSuspense from "@/components/analyst/analyst-date-range-bar-suspense";
import {
  analystRangeParams,
  hrefWithDateRange,
} from "@/lib/analyst-date-range";
import { atlLeadWhere } from "@/lib/atl-leads";
import { AtlAllLeadsTableClient } from "@/components/portal-leads/atl-all-leads-table-client";
import { UserRole } from "@/lib/constants";

export default async function AnalystTeamLeadLeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; q?: string }>;
}) {
  const session = await getSession();
  if (!session) return null;

  const { from, to, q } = await analystRangeParams(searchParams);

  const analysts = await prisma.user.findMany({
    where: { managerId: session.id, role: UserRole.LEAD_ANALYST },
    select: { id: true },
  });
  const analystIds = analysts.map((a) => a.id);

  const leads =
    analystIds.length === 0
      ? []
      : await prisma.lead.findMany({
          where: atlLeadWhere(analystIds, from, to),
          orderBy: { createdAt: "desc" },
          include: {
            createdBy: { select: { name: true } },
            team: { select: { name: true } },
            assignedMainTeamLead: { select: { name: true } },
            assignedSalesExec: { select: { name: true } },
          },
        });

  const mainTeamLeads = await prisma.user.findMany({
    where: { role: UserRole.MAIN_TEAM_LEAD },
    include: { teamAsMainLead: true },
  });
  const mtlOptions = mainTeamLeads
    .filter((u) => u.teamAsMainLead)
    .map((u) => ({
      id: u.id,
      name: u.name,
      teamName: u.teamAsMainLead!.name,
    }));

  const rows = leads.map((l) => ({
    id: l.id,
    leadName: l.leadName,
    phone: l.phone,
    leadEmail: l.leadEmail,
    source: l.source,
    notes: l.notes,
    lostNotes: l.lostNotes,
    qualificationStatus: l.qualificationStatus,
    leadScore: l.leadScore,
    salesStage: l.salesStage,
    createdAt: l.createdAt.toISOString(),
    teamId: l.teamId,
    assignedMainTeamLeadId: l.assignedMainTeamLeadId,
    createdBy: l.createdBy,
    team: l.team,
    assignedMainTeamLead: l.assignedMainTeamLead,
    assignedSalesExec: l.assignedSalesExec,
  }));

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-lf-text md:text-3xl">
            All leads
          </h1>
          <p className="mt-1 text-sm text-lf-muted">
            Leads created by your analysts ·{" "}
            <Link
              href={hrefWithDateRange("/analyst-team-lead", from, to, q)}
              className="text-lf-link hover:underline"
            >
              Back to dashboard
            </Link>
          </p>
        </div>
      </header>

      <AnalystDateRangeBarSuspense />

      <AtlAllLeadsTableClient
        key={`${from ?? ""}|${to ?? ""}`}
        leads={rows}
        initialQ={q}
        from={from}
        to={to}
        analystIdsEmpty={analystIds.length === 0}
        mtlOptions={mtlOptions}
      />
    </div>
  );
}
