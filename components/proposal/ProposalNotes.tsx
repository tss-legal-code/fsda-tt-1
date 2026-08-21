export default function ProposalNotes({ notes }: { notes: string }) {
  if (!notes) return null;

  return (
    <div className="mb-10 text-center sm:mb-14">
      <p className="text-sm italic leading-relaxed text-muted/80">
        &ldquo;{notes}&rdquo;
      </p>
    </div>
  );
}
