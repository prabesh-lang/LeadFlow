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
      className="max-h-28 max-w-[280px] overflow-auto rounded-lg border border-lf-border bg-lf-bg/50 px-2.5 py-2 text-xs leading-relaxed text-lf-text-secondary"
      title={notes}
    >
      <p className="whitespace-pre-wrap break-words">{notes}</p>
    </div>
  );
}
