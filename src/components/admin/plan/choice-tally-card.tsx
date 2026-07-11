import type { ChoiceTally } from "@/lib/plan-aggregation";

export function ChoiceTallyCard({ choice }: { choice: ChoiceTally }) {
  return (
    <div className="rounded border border-border bg-surface p-4">
      <div className="mb-2 font-medium text-sand">{choice.title}</div>
      <ul className="flex flex-col gap-1">
        {choice.tally.map((t) => (
          <li key={t.option} className="flex items-center justify-between text-sm">
            <span className="text-sand-muted">{t.option}</span>
            <span className="font-medium text-sand">{t.count}</span>
          </li>
        ))}
      </ul>
      {choice.notes.length > 0 && (
        <div className="mt-3 border-t border-border-soft pt-2">
          <div className="eyebrow mb-1">Special requirements</div>
          <ul className="flex flex-col gap-1">
            {choice.notes.map((n, i) => (
              <li key={i} className="text-sm text-sand-muted">
                <span className="text-sand">{n.artistName}:</span> {n.note}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
