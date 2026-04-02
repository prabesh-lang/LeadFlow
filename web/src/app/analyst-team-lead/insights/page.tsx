import Link from "next/link";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { AtlTeamRoutingInsights } from "@/components/atl/atl-team-routing-insights";
import { UserRole } from "@/lib/constants";

export default async function AnalystTeamLeadInsightsPage() {
  const session = await getSession();
  if (!session) return null;

  const analysts = await prisma.user.findMany({
    where: { managerId: session.id, role: UserRole.LEAD_ANALYST },
    select: { id: true },
  });
  const analystIds = analysts.map((a) => a.id);

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-lf-text md:text-3xl">
          Insights
        </h1>
        <p className="mt-1 text-sm text-lf-muted">
          Full picture of your team&apos;s leads · all time. Use the{" "}
          <Link href="/analyst-team-lead" className="text-lf-link hover:underline">
            dashboard
          </Link>{" "}
          date range to analyse a specific period.{" "}
          <Link
            href="/analyst-team-lead/team"
            className="text-lf-link hover:underline"
          >
            Members
          </Link>{" "}
          is only for adding lead analysts and main team leads.
        </p>
      </header>

      <AtlTeamRoutingInsights analystIds={analystIds} />
    </div>
  );
}
