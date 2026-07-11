import type { FreeTextGroup } from "@/lib/plan-aggregation";

/** Flagged in coral — these are the allergy/duty/notes call-outs a manager can't afford to miss buried in a per-artist view. */
export function FreeTextListCard({ group }: { group: FreeTextGroup }) {
  return (
    <div className="rounded border border-coral/30 bg-coral/5 p-4">
      <div className="mb-2 font-medium text-sand">{group.title}</div>
      <ul className="flex flex-col gap-2">
        {group.answers.map((a, i) => (
          <li key={i} className="text-sm">
            <span className="font-medium text-sand">{a.artistName}:</span>{" "}
            <span className="text-sand-muted">{a.answer}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
