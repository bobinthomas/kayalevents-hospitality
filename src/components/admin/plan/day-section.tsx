import type { ActivityRow as ActivityRowData, DaySection as DaySectionData, ScheduleCategory } from "@/lib/plan-view-model";
import { ActivityRow } from "./activity-row";
import { MealsMatrix } from "./meals-matrix";
import { FlaggedNotesStrip } from "./flagged-notes-strip";

const SCHEDULE_GROUPS: { category: ScheduleCategory | null; label: string }[] = [
  { category: null, label: "Other" },
  { category: "travel", label: "Travel (Flights)" },
  { category: "transportation", label: "Transportation (To & Fro)" },
];

function ScheduleGroup({ label, activities }: { label: string; activities: ActivityRowData[] }) {
  if (activities.length === 0) return null;
  return (
    <div>
      <h3 className="mb-1 text-sm font-medium text-sand-muted">{label}</h3>
      <div className="rounded border border-border bg-surface px-3">
        {activities.map((activity) => (
          <ActivityRow key={activity.id} activity={activity} />
        ))}
      </div>
    </div>
  );
}

/** Collapsed by default (expand/auto-expand state is owned by the parent dashboard, this component is purely controlled) so a multi-day event doesn't dump every day's detail on screen at once. */
export function DaySection({
  day,
  expanded,
  onToggle,
}: {
  day: DaySectionData;
  expanded: boolean;
  onToggle: () => void;
}) {
  const allConfirmed = day.totalPeople > 0 && day.confirmedCount === day.totalPeople;
  const nobodyConfirmed = day.confirmedCount === 0;
  const nothingToShow =
    day.activities.length === 0 && day.meals.slots.length === 0 && day.refreshments.slots.length === 0;

  return (
    <div className="overflow-hidden rounded-lg border border-border-soft">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 border-b-2 border-lagoon bg-surface-raised px-4 py-3 text-left"
        aria-expanded={expanded}
      >
        <div>
          <h2 className="font-display text-xl text-sand">{day.label}</h2>
          <p className="text-xs text-sand-muted">
            {day.date} · {day.totalPeople} {day.totalPeople === 1 ? "person" : "people"}
            {" · "}
            <span className={allConfirmed ? "text-lagoon-bright" : nobodyConfirmed ? "text-sand-muted" : "text-ocean"}>
              {day.confirmedCount} of {day.totalPeople} confirmed
            </span>
          </p>
        </div>
        <span className="text-sand-muted">{expanded ? "▲" : "▼"}</span>
      </button>

      {expanded && (
        <div className="flex flex-col gap-4 p-4">
          {SCHEDULE_GROUPS.map(({ category, label }) => (
            <ScheduleGroup
              key={label}
              label={label}
              activities={day.activities.filter((a) => a.category === category)}
            />
          ))}

          <MealsMatrix matrix={day.meals} title="Meals" />
          <MealsMatrix matrix={day.refreshments} title="Refreshments" />

          <FlaggedNotesStrip notes={day.flaggedNotes} />

          {nothingToShow && <p className="text-sm text-sand-muted">Nothing recorded for this day yet.</p>}
        </div>
      )}
    </div>
  );
}
