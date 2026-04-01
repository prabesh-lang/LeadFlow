import Link from "next/link";
import { logoutAction } from "@/app/actions/auth";
import { LogoMark } from "@/components/logo";
import { HeaderUserAvatar } from "@/components/header-user-avatar";
import { appMainContentClass, navFocusRing } from "@/lib/app-shell-ui";

const NAV = [
  { href: "/executive", label: "Dashboard" },
  { href: "/executive/leads", label: "My leads" },
  { href: "/executive/settings", label: "Settings" },
] as const;

export function ExecAppShell({
  leadCount,
  session,
  avatarUrl,
  teamName,
  children,
}: {
  leadCount: number;
  session: { name: string; email: string };
  avatarUrl: string | null;
  teamName: string | null;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-lf-bg text-lf-text">
      <header className="border-b border-white/10 bg-lf-header px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-3">
          <Link
            href="/executive"
            className="flex items-center gap-2 text-sm font-semibold text-white"
          >
            <LogoMark className="h-9 w-9" />
            <span>LeadFlow · Sales</span>
          </Link>
          <div className="flex flex-wrap items-center gap-3 text-xs text-lf-muted">
            <span className="tabular-nums">{leadCount} leads</span>
            {teamName ? (
              <span className="text-lf-link">{teamName}</span>
            ) : null}
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
        <aside className="hidden w-56 shrink-0 border-r border-white/10 bg-lf-header py-6 pl-4 pr-2 md:block">
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
  );
}
