"use client";

import { useActionState } from "react";
import { superadminCreateUserFormAction } from "@/app/actions/superadmin";
import { UserRole } from "@/lib/constants";

const inputClass =
  "min-h-10 w-full min-w-[140px] rounded-lg border border-white/10 bg-lf-bg px-3 py-2 text-sm text-lf-text outline-none ring-lf-accent/30 focus:ring-2";

export function SuperadminAddUserForms({
  atlas,
}: {
  atlas: {
    id: string;
    name: string;
    email: string;
    analystTeamName: string | null;
  }[];
}) {
  const [atlState, atlAction, atlPending] = useActionState(
    superadminCreateUserFormAction,
    undefined,
  );
  const [laState, laAction, laPending] = useActionState(
    superadminCreateUserFormAction,
    undefined,
  );

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="rounded-xl border border-white/10 bg-lf-surface/90 p-6">
        <h3 className="text-sm font-semibold text-lf-text-secondary">
          Add Analyst Team Lead
        </h3>
        <form action={atlAction} className="mt-4 space-y-4">
          <input type="hidden" name="role" value={UserRole.ANALYST_TEAM_LEAD} />
          {atlState?.error ? (
            <p className="text-sm text-red-400" role="alert">
              {atlState.error}
            </p>
          ) : null}
          <label className="block text-xs font-medium text-lf-subtle">
            Name
            <input name="name" required className={`mt-1 ${inputClass}`} />
          </label>
          <label className="block text-xs font-medium text-lf-subtle">
            Email
            <input
              name="email"
              type="email"
              required
              autoComplete="off"
              className={`mt-1 ${inputClass}`}
            />
          </label>
          <label className="block text-xs font-medium text-lf-subtle">
            Team name
            <input
              name="analystTeamName"
              required
              className={`mt-1 ${inputClass}`}
              placeholder="e.g. North America analysts"
              autoComplete="off"
            />
          </label>
          <label className="block text-xs font-medium text-lf-subtle">
            Password
            <input
              name="password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              className={`mt-1 ${inputClass}`}
            />
          </label>
          <button
            type="submit"
            disabled={atlPending}
            className="rounded-lg bg-lf-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-lf-accent-hover disabled:opacity-60"
          >
            {atlPending ? "Creating…" : "Create"}
          </button>
        </form>
      </div>
      <div className="rounded-xl border border-white/10 bg-lf-surface/90 p-6">
        <h3 className="text-sm font-semibold text-lf-text-secondary">Add Lead Analyst</h3>
        <form action={laAction} className="mt-4 space-y-4">
          <input type="hidden" name="role" value={UserRole.LEAD_ANALYST} />
          {laState?.error ? (
            <p className="text-sm text-red-400" role="alert">
              {laState.error}
            </p>
          ) : null}
          <label className="block text-xs font-medium text-lf-subtle">
            Name
            <input name="name" required className={`mt-1 ${inputClass}`} />
          </label>
          <label className="block text-xs font-medium text-lf-subtle">
            Email
            <input
              name="email"
              type="email"
              required
              autoComplete="off"
              className={`mt-1 ${inputClass}`}
            />
          </label>
          <label className="block text-xs font-medium text-lf-subtle">
            Password
            <input
              name="password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              className={`mt-1 ${inputClass}`}
            />
          </label>
          <label className="block text-xs font-medium text-lf-subtle">
            Analyst team lead
            <select
              name="managerId"
              required
              className={`mt-1 ${inputClass}`}
            >
              <option value="">Select…</option>
              {atlas.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.analystTeamName ? `${a.analystTeamName} · ` : ""}
                  {a.name} ({a.email})
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs font-medium text-lf-subtle">
            Analyst team name
            <input
              name="analystTeamName"
              required
              className={`mt-1 ${inputClass}`}
              placeholder="e.g. North America"
            />
          </label>
          <button
            type="submit"
            disabled={laPending}
            className="rounded-lg bg-lf-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-lf-accent-hover disabled:opacity-60"
          >
            {laPending ? "Creating…" : "Create"}
          </button>
        </form>
      </div>
    </div>
  );
}
