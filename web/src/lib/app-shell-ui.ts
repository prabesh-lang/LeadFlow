/** Shared layout / a11y classes for all role app shells (same theme everywhere). */

export const appMainContentClass =
  "w-full min-w-0 flex-1 max-w-none overflow-x-hidden px-4 py-6 sm:px-6 sm:py-8 lg:px-10";

/** Keyboard focus ring — identical on every portal (cyan accent, matches primary actions). */
export function navFocusRing() {
  return "outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/55 focus-visible:ring-offset-2 focus-visible:ring-offset-lf-header";
}

/** Standard card surface (dashboards, settings). */
export const portalCardClass =
  "rounded-2xl border border-white/5 bg-lf-surface p-5 shadow-sm shadow-black/20";
