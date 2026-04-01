import type { Metadata } from "next";
import { SuperadminAddUserForms } from "@/components/superadmin/superadmin-add-user-forms";
import { SuperadminDeleteForm } from "@/components/superadmin/superadmin-delete-form";
import { SuperadminPasswordForm } from "@/components/superadmin/superadmin-password-form";
import { superadminRoleLabel } from "@/lib/superadmin-ui";
import { UserRole } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Add user · Superadmin",
};

export default async function SuperadminAddUserPage() {
  const [users, atlas] = await Promise.all([
    prisma.user.findMany({
      orderBy: { email: "asc" },
      include: {
        manager: { select: { name: true, email: true } },
        team: { select: { name: true } },
      },
    }),
    prisma.user.findMany({
      where: { role: UserRole.ANALYST_TEAM_LEAD },
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true, analystTeamName: true },
    }),
  ]);

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-white">
          Add user
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-lf-muted">
          Create Lead Analyst and Analyst Team Lead accounts. Set passwords or
          remove users (superadmin accounts are protected).
        </p>
      </div>

      <SuperadminAddUserForms atlas={atlas} />

      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full min-w-[960px] text-left text-sm">
          <thead className="border-b border-white/10 bg-lf-bg/90 text-xs uppercase tracking-wide text-lf-subtle">
            <tr>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Manager / team</th>
              <th className="px-4 py-3 font-medium">Analyst team</th>
              <th className="px-4 py-3 font-medium">Password</th>
              <th className="px-4 py-3 font-medium"> </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {users.map((u) => (
              <tr key={u.id} className="align-top">
                <td className="px-4 py-3 font-mono text-xs text-lf-text-secondary">
                  {u.email}
                </td>
                <td className="px-4 py-3 text-lf-text-secondary">{u.name}</td>
                <td className="px-4 py-3 text-lf-muted">
                  {superadminRoleLabel(u.role)}
                </td>
                <td className="px-4 py-3 text-lf-text-secondary">
                  {u.manager ? (
                    <span className="text-xs">
                      {u.manager.name}
                      <br />
                      <span className="text-lf-subtle">{u.manager.email}</span>
                    </span>
                  ) : u.team ? (
                    <span className="text-xs text-lf-muted">{u.team.name}</span>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-4 py-3 text-xs text-lf-muted">
                  {u.analystTeamName ?? "—"}
                </td>
                <td className="px-4 py-3">
                  {u.role === UserRole.SUPERADMIN ? (
                    <span className="text-xs text-lf-subtle">—</span>
                  ) : (
                    <SuperadminPasswordForm userId={u.id} />
                  )}
                </td>
                <td className="px-4 py-3">
                  {u.role === UserRole.SUPERADMIN ? (
                    <span className="text-xs text-lf-subtle">—</span>
                  ) : (
                    <SuperadminDeleteForm userId={u.id} email={u.email} />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
