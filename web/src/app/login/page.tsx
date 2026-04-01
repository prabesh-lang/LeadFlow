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
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-lf-bg via-lf-header to-lf-bg px-4">
      <div className="w-full max-w-md rounded-2xl border border-violet-500/20 bg-lf-surface/90 p-8 shadow-2xl shadow-cyan-950/20 backdrop-blur-sm">
        <div className="text-center">
          <h1 className="bg-gradient-to-r from-white via-cyan-100 to-violet-200 bg-clip-text text-2xl font-semibold tracking-tight text-transparent">
            LeadFlow
          </h1>
          <p className="mt-1 text-sm text-lf-muted">Sign in to continue</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
