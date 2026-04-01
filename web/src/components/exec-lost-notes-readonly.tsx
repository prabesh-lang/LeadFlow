/** Read-only display of sales executive lost-deal notes (shared across analyst / ATL / MTL views). */
export default function ExecLostNotesReadonly({
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
