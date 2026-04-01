"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

/** Keeps `?q=` in sync after typing pauses (shareable URL, preserves with date bar). */
export function useDebouncedLeadSearchUrl(query: string, delayMs = 400) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const searchSnapshot = sp.toString();

  useEffect(() => {
    const t = setTimeout(() => {
      const tq = query.trim().slice(0, 200);
      const params = new URLSearchParams(searchSnapshot);
      const currentQ = params.get("q") ?? "";
      if (tq === currentQ) return;

      if (tq) params.set("q", tq);
      else params.delete("q");
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname);
    }, delayMs);
    return () => clearTimeout(t);
  }, [query, delayMs, pathname, router, searchSnapshot]);
}
