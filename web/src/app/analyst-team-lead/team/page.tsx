import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { AtlTeamMembersClient } from "@/components/atl/atl-team-members-client";
import { UserRole } from "@/lib/constants";

export default async function AnalystTeamLeadTeamPage() {
  const session = await getSession();
  if (!session) return null;

  const analysts = await prisma.user.findMany({
    where: { managerId: session.id, role: UserRole.LEAD_ANALYST },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      analystTeamName: true,
      provisioningPassword: true,
    },
  });

  const teams = await prisma.team.findMany({
    orderBy: { name: "asc" },
    include: {
      mainTeamLead: {
        select: {
          name: true,
          email: true,
          provisioningPassword: true,
        },
      },
      whatsappLines: {
        orderBy: { sortOrder: "asc" },
        select: { id: true, phone: true, label: true },
      },
    },
  });

  return (
    <div className="mx-auto max-w-6xl">
      <AtlTeamMembersClient analysts={analysts} teams={teams} />
    </div>
  );
}
