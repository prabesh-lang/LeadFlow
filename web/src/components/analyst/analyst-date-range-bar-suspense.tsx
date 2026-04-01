import { Suspense } from "react";
import AnalystDateRangeBar from "@/components/analyst/analyst-date-range-bar";

export default function AnalystDateRangeBarSuspense() {
  return (
    <Suspense
      fallback={
        <div className="h-12 animate-pulse rounded-xl border border-white/5 bg-lf-surface" />
      }
    >
      <AnalystDateRangeBar />
    </Suspense>
  );
}
