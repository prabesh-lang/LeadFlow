import Link from "next/link";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import AnalystDateRangeBarSuspense from "@/components/analyst/analyst-date-range-bar-suspense";
import {
  analystRangeParams,
  hrefWithDateRange,
  leadWhereWithDateRange,
} from "@/lib/analyst-date-range";
import { AnalystAllLeadsTableClient } from "@/components/portal-leads/analyst-all-leads-table-client";

export default async function AnalystAllLeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; q?: string }>;
}) {
  const session = await getSession();
  if (!session) return null;

  const { from, to, q } = await analystRangeParams(searchParams);

  const leads = await prisma.lead.findMany({
    where: leadWhereWithDateRange(session.id, from, to),
    orderBy: { createdAt: "desc" },
  });

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
  }));

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white md:text-3xl">
            All leads
          </h1>
          <p className="mt-1 text-sm text-lf-muted">
            Every lead you have added ·{" "}
            <Link
              href={hrefWithDateRange("/analyst", from, to, q)}
              className="text-lf-link hover:underline"
            >
              Back to dashboard
            </Link>
            {" · "}
            <Link
              href="/analyst/leads/import"
              className="text-lf-link hover:underline"
            >
              Import from Excel
            </Link>
          </p>
        </div>
      </header>

      <AnalystDateRangeBarSuspense />

      <AnalystAllLeadsTableClient
        key={`${from ?? ""}|${to ?? ""}`}
        leads={rows}
        initialQ={q}
        from={from}
        to={to}
      />
    </div>
  );
}
