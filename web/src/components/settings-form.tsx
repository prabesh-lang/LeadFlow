"use client";

import { useActionState } from "react";
import { updateProfile } from "@/app/actions/settings";

export default function SettingsForm({
  defaultName,
}: {
  defaultName: string;
}) {
  const [state, action, pending] = useActionState(
    async (_: unknown, formData: FormData) => updateProfile(formData),
    undefined as { error?: string; ok?: boolean } | undefined,
  );

  return (
    <form
      action={action}
      className="mx-auto flex max-w-lg flex-col gap-4 rounded-xl border border-lf-border bg-lf-surface/90 p-6"
    >
      <h2 className="text-lg font-medium text-lf-text">Profile & security</h2>
      <label className="text-xs text-lf-subtle">
        Display name
        <input
          name="name"
          required
          defaultValue={defaultName}
          className="mt-1 w-full rounded-md border border-lf-border bg-lf-bg px-3 py-2 text-sm text-lf-text outline-none ring-lf-brand/35 focus:ring-2"
        />
      </label>
      <label className="text-xs text-lf-subtle">
        Profile photo (JPEG or PNG)
        <input
          name="photo"
          type="file"
          accept="image/jpeg,image/png"
          className="mt-1 w-full text-sm text-lf-muted file:mr-3 file:rounded-md file:border-0 file:bg-lf-elevated file:px-3 file:py-2 file:text-lf-text-secondary"
        />
      </label>
      <div className="border-t border-lf-border pt-4">
        <p className="text-xs font-medium uppercase tracking-wide text-lf-subtle">
          Change password
        </p>
        <label className="mt-2 block text-xs text-lf-subtle">
          Current password
          <input
            name="currentPassword"
            type="password"
            autoComplete="current-password"
            className="mt-1 w-full rounded-md border border-lf-border bg-lf-bg px-3 py-2 text-sm text-lf-text outline-none ring-lf-brand/35 focus:ring-2"
          />
        </label>
        <label className="mt-2 block text-xs text-lf-subtle">
          New password (leave blank to keep)
          <input
            name="newPassword"
            type="password"
            autoComplete="new-password"
            className="mt-1 w-full rounded-md border border-lf-border bg-lf-bg px-3 py-2 text-sm text-lf-text outline-none ring-lf-brand/35 focus:ring-2"
          />
        </label>
      </div>
      {state?.error ? (
        <p className="text-sm text-lf-danger">{state.error}</p>
      ) : null}
      {state?.ok ? (
        <p className="text-sm text-lf-success">Profile updated.</p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-lf-accent px-3 py-2 text-sm font-medium text-lf-on-accent hover:bg-lf-accent-hover disabled:opacity-50"
      >
        {pending ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}
