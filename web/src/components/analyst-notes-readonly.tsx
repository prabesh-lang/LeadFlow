/** Lead analyst notes (Lead.notes) — visible to all roles that can view the lead. */
export default function AnalystNotesReadonly({
  notes,
}: {
  notes: string | null;
}) {
  if (!notes?.trim()) {
    return <span className="text-lf-subtle">—</span>;
  }
  return (
    <div
      className="max-h-36 min-w-0 max-w-[min(100%,20rem)] overflow-y-auto rounded-lg border border-lf-border bg-lf-bg/60 px-3 py-2.5 text-xs leading-relaxed text-lf-text-secondary shadow-inner shadow-black/5"
      title={notes}
    >
      <p className="whitespace-pre-wrap break-words normal-case">{notes}</p>
    </div>
  );
}
