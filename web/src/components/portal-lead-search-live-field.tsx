"use client";

type Props = {
  value: string;
  onChange: (next: string) => void;
};

/** Controlled search field (parent runs live filter + debounced URL sync). */
export function PortalLeadSearchLiveField({ value, onChange }: Props) {
  return (
    <div
      className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3"
      role="search"
    >
      <label htmlFor="portal-lead-q-live" className="sr-only">
        Search by client name or phone number
      </label>
      <div className="relative min-w-0 flex-1">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-lf-subtle">
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z"
            />
          </svg>
        </span>
        <input
          id="portal-lead-q-live"
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Search by name or phone…"
          autoComplete="off"
          enterKeyHint="search"
          className="min-h-11 w-full rounded-xl border border-white/10 bg-lf-bg py-2.5 pl-10 pr-3 text-sm text-white placeholder:text-lf-subtle outline-none ring-lf-accent/30 focus:border-lf-accent/40 focus:ring-2"
        />
      </div>
      {value.trim() ? (
        <button
          type="button"
          onClick={() => onChange("")}
          className="min-h-11 shrink-0 rounded-xl border border-white/15 px-4 text-sm font-medium text-lf-muted transition hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
        >
          Clear
        </button>
      ) : null}
    </div>
  );
}
