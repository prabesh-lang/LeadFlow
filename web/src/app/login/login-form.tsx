"use client";

import { useActionState } from "react";
import { loginFormAction } from "@/app/actions/login-form";

export default function LoginForm() {
  const [state, action, pending] = useActionState(loginFormAction, undefined);

  return (
    <form action={action} className="mt-8 flex flex-col gap-5">
      <label className="block text-sm font-medium text-lf-text-secondary">
        Email
        <input
          name="email"
          type="email"
          required
          autoComplete="username"
          className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 bg-lf-elevated px-3 py-2.5 text-lf-text outline-none transition placeholder:text-lf-subtle focus:border-lf-accent/50 focus:ring-2 focus:ring-lf-accent/25"
        />
      </label>
      <label className="block text-sm font-medium text-lf-text-secondary">
        Password
        <input
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 bg-lf-elevated px-3 py-2.5 text-lf-text outline-none transition placeholder:text-lf-subtle focus:border-lf-accent/50 focus:ring-2 focus:ring-lf-accent/25"
        />
      </label>
      {state?.error ? (
        <p className="text-sm text-lf-danger" role="alert">
          {state.error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="min-h-11 rounded-xl bg-lf-accent px-4 py-2.5 font-semibold text-lf-on-accent shadow-lg shadow-indigo-900/20 transition hover:bg-lf-accent-hover disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lf-on-accent focus-visible:ring-offset-2 focus-visible:ring-offset-lf-accent active:scale-[0.99]"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
      <p className="text-xs text-lf-subtle">
        After running the seed against your Supabase project, use the demo emails from{" "}
        <code className="text-lf-muted">prisma/seed.ts</code> with password{" "}
        <code className="text-lf-muted">password123</code>.
      </p>
    </form>
  );
}
