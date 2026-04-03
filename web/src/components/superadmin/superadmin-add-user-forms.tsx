"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { superadminCreateUserFormAction } from "@/app/actions/superadmin";
import { UserRole } from "@/lib/constants";

const inputClass =
  "min-h-10 w-full min-w-[140px] rounded-lg border border-lf-border bg-lf-bg px-3 py-2 text-sm text-lf-text outline-none ring-lf-brand/35 focus:ring-2";

function AddLeadAnalystForm({
  atlas,
  laState,
  laAction,
  laPending,
}: {
  atlas: {
    id: string;
    name: string;
    email: string;
    analystTeamName: string | null;
  }[];
  laState: { error?: string } | undefined;
  laAction: (formData: FormData) => void;
  laPending: boolean;
}) {
  const [managerId, setManagerId] = useState("");
  const [analystTeamName, setAnalystTeamName] = useState("");
  const wasLaPending = useRef(false);

  const onManagerChange = (id: string) => {
    setManagerId(id);
    if (!id) {
      setAnalystTeamName("");
      return;
    }
    const atl = atlas.find((a) => a.id === id);
    setAnalystTeamName(atl?.analystTeamName?.trim() ?? "");
  };

  /* Reset after successful server action — useActionState exposes no onSuccess callback. */
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (wasLaPending.current && !laPending && !laState?.error) {
      setManagerId("");
      setAnalystTeamName("");
    }
    wasLaPending.current = laPending;
  }, [laPending, laState]);
  /* eslint-enable react-hooks/set-state-in-effect */

  return (
    <div className="rounded-xl border border-lf-border bg-lf-surface/90 p-6">
      <h3 className="text-sm font-semibold text-lf-text-secondary">Add Lead Analyst</h3>
      <form action={laAction} className="mt-4 space-y-4" autoComplete="off">
        <input type="hidden" name="role" value={UserRole.LEAD_ANALYST} />
        {laState?.error ? (
          <p className="text-sm text-lf-danger" role="alert">
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
            value={managerId}
            onChange={(e) => onManagerChange(e.target.value)}
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
            value={managerId ? analystTeamName : ""}
            onChange={(e) => {
              if (!managerId) return;
              setAnalystTeamName(e.target.value);
            }}
            className={`mt-1 ${inputClass}`}
            placeholder="e.g. North America"
            autoComplete="off"
          />
        </label>
        <p className="text-xs text-lf-subtle">
          Fills from the selected team lead’s cohort name; you can edit before
          creating.
        </p>
        <button
          type="submit"
          disabled={laPending}
          className="rounded-lg bg-lf-accent px-4 py-2.5 text-sm font-semibold text-lf-on-accent hover:bg-lf-accent-hover disabled:opacity-60"
        >
          {laPending ? "Creating…" : "Create"}
        </button>
      </form>
    </div>
  );
}

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
      <div className="rounded-xl border border-lf-border bg-lf-surface/90 p-6">
        <h3 className="text-sm font-semibold text-lf-text-secondary">
          Add Analyst Team Lead
        </h3>
        <form action={atlAction} className="mt-4 space-y-4">
          <input type="hidden" name="role" value={UserRole.ANALYST_TEAM_LEAD} />
          {atlState?.error ? (
            <p className="text-sm text-lf-danger" role="alert">
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
            className="rounded-lg bg-lf-accent px-4 py-2.5 text-sm font-semibold text-lf-on-accent hover:bg-lf-accent-hover disabled:opacity-60"
          >
            {atlPending ? "Creating…" : "Create"}
          </button>
        </form>
      </div>
      <AddLeadAnalystForm
        atlas={atlas}
        laState={laState}
        laAction={laAction}
        laPending={laPending}
      />
    </div>
  );
}
