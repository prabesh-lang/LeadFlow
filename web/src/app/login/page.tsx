import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { homePathForRole } from "@/lib/role-home";
import LoginForm from "./login-form";

export default async function LoginPage() {
  const session = await getSession();
  if (session) {
    redirect(homePathForRole(session.role) ?? "/login");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-slate-100/80 via-white to-lf-bg px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-lf-surface p-8 shadow-xl shadow-slate-300/35 ring-1 ring-slate-200/60">
        <div className="text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-lf-text">
            LeadFlow
          </h1>
          <p className="mt-1 text-sm text-lf-muted">Sign in to continue</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
