"use client";

import { useActionState } from "react";
import { superadminDeleteUserFormAction } from "@/app/actions/superadmin";
import { ConfirmSubmitButton } from "@/components/superadmin/confirm-submit-button";

export function SuperadminDeleteForm({
  userId,
  email,
}: {
  userId: string;
  email: string;
}) {
  const [state, action, pending] = useActionState(
    superadminDeleteUserFormAction,
    undefined,
  );

  return (
    <form action={action} className="space-y-1">
      <input type="hidden" name="userId" value={userId} />
      {state?.error ? (
        <p className="max-w-[200px] text-xs text-red-400" role="alert">
          {state.error}
        </p>
      ) : null}
      <ConfirmSubmitButton
        message={`Delete user ${email}? This cannot be undone.`}
        disabled={pending}
        className="rounded-lg border border-red-900/80 bg-red-950/40 px-3 py-2 text-xs font-medium text-red-300 hover:bg-red-950/70 disabled:opacity-60"
      >
        {pending ? "…" : "Delete"}
      </ConfirmSubmitButton>
    </form>
  );
}
