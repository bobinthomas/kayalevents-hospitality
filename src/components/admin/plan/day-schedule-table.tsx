import type { ScheduleEntry } from "@/lib/plan-aggregation";

export function DayScheduleTable({ entries }: { entries: ScheduleEntry[] }) {
  if (entries.length === 0) return null;

  return (
    <div>
      <h3 className="mb-2 text-sm font-medium text-sand-muted">Schedule</h3>
      <div className="flex flex-col gap-2 rounded border border-border bg-surface p-3">
        {entries.map((entry, i) => (
          <div
            key={i}
            className="flex flex-col gap-0.5 border-b border-border-soft pb-2 last:border-b-0 last:pb-0 sm:flex-row sm:items-baseline sm:gap-3"
          >
            <span className="w-20 shrink-0 font-bold text-sand">{entry.time ?? "—"}</span>
            <span className="w-40 shrink-0 text-sm text-sand">
              {entry.artistName} <span className="text-sand-muted">· {entry.artistRole}</span>
            </span>
            <span className="flex-1 text-sm text-sand-muted">
              <span className="text-sand">{entry.title}</span>
              {entry.content && <> — {entry.content}</>}
              {!entry.hasResponded && (
                <span className="ml-2 rounded-full bg-surface-raised px-1.5 py-0.5 text-xs text-sand-muted">
                  not submitted — may change
                </span>
              )}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
