import type { ActivityRow as ActivityRowData } from "@/lib/plan-view-model";
import { PersonChip } from "./person-chip";

export function ActivityRow({ activity }: { activity: ActivityRowData }) {
  return (
    <div className="flex flex-col gap-2 border-b border-border-soft py-3 last:border-b-0 sm:flex-row sm:items-baseline sm:gap-4">
      <span
        className="w-24 shrink-0 font-bold text-sand"
        style={{ fontVariantNumeric: "tabular-nums" }}
      >
        {activity.time ?? "—"}
      </span>
      <div className="flex-1">
        <span className="text-sand">{activity.title}</span>
        {activity.detail && <span className="text-sand-muted"> — {activity.detail}</span>}
      </div>
      <div className="flex flex-wrap items-center gap-1.5 sm:w-64 sm:shrink-0 sm:justify-end">
        {activity.isUniformStatus ? (
          <span className="text-xs text-sand-muted">{activity.collapsedSummary}</span>
        ) : (
          activity.people.map((person) => <PersonChip key={person.artistName} person={person} />)
        )}
      </div>
    </div>
  );
}
