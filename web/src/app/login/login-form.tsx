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
          className="mt-2 min-h-11 w-full rounded-full border border-lf-border bg-lf-elevated px-4 py-2.5 text-lf-text outline-none transition placeholder:text-lf-subtle focus:border-lf-brand/50 focus:ring-2 focus:ring-lf-brand/25"
        />
      </label>
      <label className="block text-sm font-medium text-lf-text-secondary">
        Password
        <input
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="mt-2 min-h-11 w-full rounded-full border border-lf-border bg-lf-elevated px-4 py-2.5 text-lf-text outline-none transition placeholder:text-lf-subtle focus:border-lf-brand/50 focus:ring-2 focus:ring-lf-brand/25"
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
        className="min-h-11 rounded-full bg-lf-accent px-6 py-2.5 text-sm font-bold uppercase tracking-wide text-lf-on-accent shadow-lg shadow-[#c62828]/35 transition hover:bg-lf-accent-hover disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-lf-accent active:scale-[0.99]"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
      <p className="text-xs text-lf-subtle">
        First-time cloud deploy creates only{" "}
        <code className="text-lf-muted">superadmin@demo.local</code> (password{" "}
        <code className="text-lf-muted">password123</code>). After a full{" "}
        <code className="text-lf-muted">prisma db seed</code>, see all demo accounts in{" "}
        <code className="text-lf-muted">prisma/seed.ts</code>.
      </p>
    </form>
  );
}
