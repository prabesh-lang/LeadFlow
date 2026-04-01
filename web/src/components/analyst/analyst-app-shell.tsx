import Link from "next/link";
import { logoutAction } from "@/app/actions/auth";
import { LogoMark } from "@/components/logo";
import { HeaderUserAvatar } from "@/components/header-user-avatar";
import { AnalystAddLeadProvider } from "@/components/analyst/add-lead-modal";
import { appMainContentClass, navFocusRing } from "@/lib/app-shell-ui";

const NAV = [
  { href: "/analyst", label: "Dashboard" },
  { href: "/analyst/pipeline", label: "Pipeline" },
  { href: "/analyst/leads", label: "Leads" },
  { href: "/analyst/leads/import", label: "Import" },
  { href: "/analyst/settings", label: "Settings" },
] as const;

export function AnalystAppShell({
  leadCount,
  session,
  avatarUrl,
  children,
}: {
  leadCount: number;
  session: { name: string; email: string };
  avatarUrl: string | null;
  children: React.ReactNode;
}) {
  return (
    <AnalystAddLeadProvider>
      <div className="flex min-h-screen flex-col bg-lf-bg text-lf-text">
        <header className="border-b border-white/10 bg-lf-header px-4 py-3 sm:px-6">
          <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-3">
            <Link
              href="/analyst"
              className="flex items-center gap-2 text-sm font-semibold text-white"
            >
              <LogoMark className="h-9 w-9" />
              <span>LeadFlow · Analyst</span>
            </Link>
            <div className="flex flex-wrap items-center gap-3 text-xs text-lf-muted">
              <span className="tabular-nums">{leadCount} leads</span>
              <span className="hidden sm:inline">{session.email}</span>
              <HeaderUserAvatar name={session.name} avatarUrl={avatarUrl} />
              <form action={logoutAction}>
                <button
                  type="submit"
                  className={`rounded-lg px-3 py-1.5 text-lf-text-secondary hover:bg-white/5 ${navFocusRing()}`}
                >
                  Sign out
                </button>
              </form>
            </div>
          </div>
        </header>
        <div className="flex min-h-0 flex-1">
          <aside className="hidden w-52 shrink-0 border-r border-white/10 bg-lf-header py-6 pl-4 pr-2 md:block">
            <nav className="space-y-1 text-sm">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block rounded-lg px-3 py-2 text-lf-muted hover:bg-white/5 hover:text-white ${navFocusRing()}`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </aside>
          <main className={appMainContentClass}>{children}</main>
        </div>
      </div>
    </AnalystAddLeadProvider>
  );
}
