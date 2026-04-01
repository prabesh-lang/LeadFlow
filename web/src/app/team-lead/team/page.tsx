import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@/lib/constants";
import { MtlSalesTeamActionsEntry } from "@/components/mtl/mtl-sales-team-actions-entry";
import { MtlProvisionedPasswordCell } from "@/components/mtl/mtl-provisioned-password-cell";
import { MtlTransferExecButton } from "@/components/mtl/mtl-transfer-exec-button";
export default async function TeamLeadSalesTeamPage() {
  const session = await getSession();
  if (!session) return null;

  const team = session.teamId
    ? await prisma.team.findUnique({
        where: { id: session.teamId },
        select: { name: true },
      })
    : null;

  const execs =
    session.teamId == null
      ? []
      : await prisma.user.findMany({
          where: {
            teamId: session.teamId,
            role: UserRole.SALES_EXECUTIVE,
          },
          orderBy: { name: "asc" },
          select: {
            id: true,
            name: true,
            email: true,
            provisioningPassword: true,
          },
        });

  const otherTeams =
    session.teamId == null
      ? []
      : await prisma.team.findMany({
          where: { id: { not: session.teamId } },
          orderBy: { name: "asc" },
          select: {
            id: true,
            name: true,
            mainTeamLead: { select: { name: true } },
          },
        });

  const transferTeamOptions = otherTeams.map((t) => ({
    id: t.id,
    name: t.name,
    mainTeamLeadName: t.mainTeamLead.name,
  }));

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-white md:text-3xl">
            Sales team
          </h1>
          <p className="mt-1 text-sm text-lf-muted">
            {team?.name ?? "Your team"} · add representatives and share login
            details once.
          </p>
        </div>
        <div className="shrink-0">
          <MtlSalesTeamActionsEntry teamName={team?.name ?? null} />
        </div>
      </header>

      <section className="rounded-2xl border border-white/5 bg-lf-surface p-5">
        <h2 className="text-base font-semibold text-white">
          Sales executives ({execs.length})
        </h2>
        <p className="mt-1 text-sm text-lf-muted">
          Temporary password is stored when you create the account; it clears
          after the user changes their password in settings. Use Transfer to
          move a rep to another sales team when your organisation reassigns
          them.
        </p>
        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-white/5 text-xs uppercase tracking-wide text-lf-subtle">
              <tr>
                <th className="px-3 py-2 font-semibold">Name</th>
                <th className="px-3 py-2 font-semibold">Email</th>
                <th className="px-3 py-2 font-semibold">Temp. password</th>
                <th className="px-3 py-2 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {execs.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-3 py-8 text-center text-lf-subtle"
                  >
                    No sales executives yet. Use Add sales executive to create
                    one.
                  </td>
                </tr>
              ) : (
                execs.map((e) => (
                  <tr key={e.id}>
                    <td className="px-3 py-3 font-medium text-white">
                      {e.name}
                    </td>
                    <td className="px-3 py-3 text-lf-muted">{e.email}</td>
                    <td className="px-3 py-3">
                      <MtlProvisionedPasswordCell
                        plain={e.provisioningPassword}
                      />
                    </td>
                    <td className="px-3 py-3 text-right">
                      <MtlTransferExecButton
                        execId={e.id}
                        execName={e.name}
                        teams={transferTeamOptions}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
