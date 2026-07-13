import type { FlaggedNote } from "@/lib/plan-view-model";

/** Special-requirements notes pulled out of meal cells entirely — these are the item most likely to need action, so they get one flagged strip per day instead of being buried in per-meal footnotes. */
export function FlaggedNotesStrip({ notes }: { notes: FlaggedNote[] }) {
  if (notes.length === 0) return null;

  return (
    <div className="rounded border border-coral/30 bg-coral/5 p-3">
      <div className="eyebrow mb-2">Special requirements</div>
      <ul className="flex flex-col gap-1 text-sm">
        {notes.map((n, i) => (
          <li key={i}>
            <span className="font-medium text-sand">{n.artistName}</span>{" "}
            <span className="text-sand-muted">
              · {n.note} — applies to {n.mealTitles.join(", ")}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
