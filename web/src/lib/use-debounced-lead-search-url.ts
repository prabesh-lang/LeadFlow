"use client";

import { startTransition, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

/**
 * Keeps `?q=` in sync after typing pauses (shareable URL, preserves with date bar).
 *
 * Does not use `useSearchParams()` — that hook requires a parent `<Suspense>`
 * boundary in the App Router. We read `window.location.search` inside the effect
 * only. Updates run inside `startTransition` to avoid React concurrent-mode issues
 * with `router.replace`.
 */
export function useDebouncedLeadSearchUrl(query: string, delayMs = 400) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const t = setTimeout(() => {
      const tq = query.trim().slice(0, 200);
      const params = new URLSearchParams(
        typeof window !== "undefined" ? window.location.search.slice(1) : "",
      );
      const currentQ = params.get("q") ?? "";
      if (tq === currentQ) return;

      if (tq) params.set("q", tq);
      else params.delete("q");
      const qs = params.toString();
      const href = qs ? `${pathname}?${qs}` : pathname;
      startTransition(() => {
        try {
          router.replace(href);
        } catch {
          if (typeof window !== "undefined") {
            window.history.replaceState(null, "", href);
            router.refresh();
          }
        }
      });
    }, delayMs);
    return () => clearTimeout(t);
  }, [query, delayMs, pathname, router]);
}
