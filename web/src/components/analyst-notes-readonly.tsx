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
    <p
      className="max-w-[260px] whitespace-pre-wrap break-words text-xs leading-relaxed text-lf-text-secondary"
      title={notes}
    >
      {notes}
    </p>
  );
}
