"use client";

import { useActionState } from "react";
import { superadminSetPasswordFormAction } from "@/app/actions/superadmin";

const inputClass =
  "min-h-10 w-full min-w-[140px] max-w-[200px] rounded-lg border border-white/10 bg-lf-bg px-3 py-2 text-sm text-lf-text outline-none ring-lf-accent/30 focus:ring-2";

export function SuperadminPasswordForm({ userId }: { userId: string }) {
  const [state, action, pending] = useActionState(
    superadminSetPasswordFormAction,
    undefined,
  );

  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="userId" value={userId} />
      {state?.error ? (
        <p className="text-xs text-red-400" role="alert">
          {state.error}
        </p>
      ) : null}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          name="password"
          type="password"
          minLength={8}
          placeholder="New password"
          autoComplete="new-password"
          className={inputClass}
        />
        <button
          type="submit"
          disabled={pending}
          className="shrink-0 rounded-lg border border-white/10 px-3 py-2 text-xs font-medium text-lf-text-secondary hover:bg-white/5 disabled:opacity-60"
        >
          {pending ? "…" : "Set"}
        </button>
      </div>
    </form>
  );
}
