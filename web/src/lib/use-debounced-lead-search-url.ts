"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

/**
 * Keeps `?q=` in sync after typing pauses (shareable URL, preserves with date bar).
 *
 * Does not use `useSearchParams()` — that hook requires a parent `<Suspense>`
 * boundary in the App Router; without it, client navigations (e.g. after applying
 * a date range) can crash. We read `window.location.search` inside the effect only.
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
      router.replace(qs ? `${pathname}?${qs}` : pathname);
    }, delayMs);
    return () => clearTimeout(t);
  }, [query, delayMs, pathname, router]);
}
