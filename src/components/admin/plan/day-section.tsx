import { SCHEDULE_GROUP_LABELS, type ActivityRow as ActivityRowData, type DaySection as DaySectionData } from "@/lib/plan-view-model";
import { ActivityRow } from "./activity-row";
import { MealsMatrix } from "./meals-matrix";
import { FlaggedNotesStrip } from "./flagged-notes-strip";

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

/** Renders one day's full-roster content — which day is showing is controlled by the day tabs in plan-dashboard-client.tsx, not by this component. */
export function DaySection({ day }: { day: DaySectionData }) {
  const allConfirmed = day.totalPeople > 0 && day.confirmedCount === day.totalPeople;
  const nobodyConfirmed = day.confirmedCount === 0;
  const nothingToShow =
    day.activities.length === 0 && day.meals.slots.length === 0 && day.refreshments.slots.length === 0;

  return (
    <div className="flex flex-col gap-4">
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

      {SCHEDULE_GROUP_LABELS.map(({ category, label }) => (
        <ScheduleGroup key={label} label={label} activities={day.activities.filter((a) => a.category === category)} />
      ))}

      <MealsMatrix matrix={day.meals} title="Meals" />
      <MealsMatrix matrix={day.refreshments} title="Refreshments" />

      <FlaggedNotesStrip notes={day.flaggedNotes} />

      {nothingToShow && <p className="text-sm text-sand-muted">Nothing recorded for this day yet.</p>}
    </div>
  );
}
