import Link from "next/link";
import { logoutAction } from "@/app/actions/auth";
import { LogoMark } from "@/components/logo";
import { HeaderUserAvatar } from "@/components/header-user-avatar";
import {
  AtlNotificationBell,
  type AtlNotificationItem,
} from "@/components/atl/atl-notification-bell";
import { appMainContentClass, navFocusRing } from "@/lib/app-shell-ui";

const NAV = [
  { href: "/analyst-team-lead", label: "Dashboard" },
  { href: "/analyst-team-lead/leads", label: "Leads" },
  { href: "/analyst-team-lead/insights", label: "Insights" },
  { href: "/analyst-team-lead/team", label: "Team" },
  { href: "/analyst-team-lead/settings", label: "Settings" },
] as const;

export function AtlAppShell({
  leadCount,
  session,
  avatarUrl,
  notifications,
  notificationUnreadCount,
  children,
}: {
  leadCount: number;
  session: { name: string; email: string };
  avatarUrl: string | null;
  notifications: AtlNotificationItem[];
  notificationUnreadCount: number;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-lf-bg text-lf-text">
      <header className="sticky top-0 z-20 border-b border-lf-border bg-lf-header/95 px-4 py-3 shadow-sm shadow-black/8 backdrop-blur-sm sm:px-6">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-3">
          <Link
            href="/analyst-team-lead"
            className="flex items-center gap-2 text-sm font-semibold text-lf-text"
          >
            <LogoMark className="h-9 w-9" />
            <span>LeadFlow · Analyst TL</span>
          </Link>
          <div className="flex flex-wrap items-center gap-3 text-xs text-lf-muted">
            <span className="tabular-nums">{leadCount} leads</span>
            <AtlNotificationBell
              initialItems={notifications}
              initialUnread={notificationUnreadCount}
            />
            <span className="hidden sm:inline">{session.email}</span>
            <HeaderUserAvatar name={session.name} avatarUrl={avatarUrl} />
            <form action={logoutAction}>
              <button
                type="submit"
                className={`rounded-lg px-3 py-1.5 text-lf-text-secondary hover:bg-lf-bg/50 ${navFocusRing()}`}
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>
      <div className="flex min-h-0 flex-1">
        <aside className="hidden w-52 shrink-0 border-r border-lf-border bg-lf-header py-6 pl-4 pr-2 md:block">
          <nav className="space-y-1 text-sm">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`block rounded-lg px-3 py-2 text-lf-muted hover:bg-lf-bg/50 hover:text-lf-text ${navFocusRing()}`}
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
