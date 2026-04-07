import type { Metadata } from "next";
import { SuperadminAddUserCard } from "@/components/superadmin/superadmin-add-user-forms";
import { SuperadminDeleteForm } from "@/components/superadmin/superadmin-delete-form";
import { SuperadminPasswordForm } from "@/components/superadmin/superadmin-password-form";
import { superadminRoleLabel } from "@/lib/superadmin-ui";
import { UserRole } from "@/lib/constants";
import { dbQuery } from "@/lib/db/pool";

export const metadata: Metadata = {
  title: "Add user · Superadmin",
};

export default async function SuperadminAddUserPage() {
  const [userRows, atlas] = await Promise.all([
    dbQuery<{
      id: string;
      email: string;
      name: string;
      role: string;
      passwordHash: string | null;
      analystTeamName: string | null;
      mgr_name: string | null;
      mgr_email: string | null;
      team_name: string | null;
    }>(
      `SELECT u.id, u.email, u.name, u.role, u."passwordHash", u."analystTeamName",
        mgr.name AS mgr_name, mgr.email AS mgr_email, tm.name AS team_name
       FROM "User" u
       LEFT JOIN "User" mgr ON mgr.id = u."managerId"
       LEFT JOIN "Team" tm ON tm.id = u."teamId"
       ORDER BY u.email ASC`,
    ),
    dbQuery<{
      id: string;
      name: string;
      email: string;
      analystTeamName: string | null;
    }>(
      `SELECT id, name, email, "analystTeamName" FROM "User"
       WHERE role = $1 ORDER BY name ASC`,
      [UserRole.ANALYST_TEAM_LEAD],
    ),
  ]);

  const users = userRows.map((u) => ({
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    password: u.passwordHash,
    analystTeamName: u.analystTeamName,
    manager:
      u.mgr_name && u.mgr_email
        ? { name: u.mgr_name, email: u.mgr_email }
        : null,
    team: u.team_name ? { name: u.team_name } : null,
  }));

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-semibold tracking-tight text-lf-text">
            Add user
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-lf-muted">
            Create Lead Analyst and Analyst Team Lead accounts from the card on
            the right. Set passwords or remove users (superadmin accounts are
            protected).
          </p>
        </div>
        <SuperadminAddUserCard atlas={atlas} />
      </div>

      <div className="overflow-x-auto rounded-xl border border-lf-border">
        <table className="w-full min-w-[960px] text-left text-sm">
          <thead className="border-b border-lf-border bg-lf-bg/90 text-xs uppercase tracking-wide text-lf-subtle">
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
          <tbody className="divide-y divide-lf-divide">
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
                    <SuperadminPasswordForm
                      userId={u.id}
                      initialPassword={u.password}
                    />
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
