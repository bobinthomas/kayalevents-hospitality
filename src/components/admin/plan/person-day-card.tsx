import { SCHEDULE_GROUP_LABELS, type ActivityRow, type PersonDayItinerary } from "@/lib/plan-view-model";

function ActivityGroup({ label, activities }: { label: string; activities: ActivityRow[] }) {
  if (activities.length === 0) return null;
  return (
    <div>
      <h4 className="mb-1 text-xs font-medium text-sand-muted">{label}</h4>
      <div className="rounded border border-border bg-surface px-3">
        {activities.map((activity) => (
          <div
            key={activity.id}
            className="flex flex-col gap-1 border-b border-border-soft py-3 last:border-b-0 sm:flex-row sm:items-baseline sm:gap-4"
          >
            <span className="w-24 shrink-0 font-bold text-sand" style={{ fontVariantNumeric: "tabular-nums" }}>
              {activity.time ?? "—"}
            </span>
            <div className="flex-1">
              <span className="text-sand">{activity.title}</span>
              {activity.detail && <span className="text-sand-muted"> — {activity.detail}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MealList({ label, meals }: { label: string; meals: PersonDayItinerary["meals"] }) {
  if (meals.length === 0) return null;
  return (
    <div>
      <h4 className="mb-1 text-xs font-medium text-sand-muted">{label}</h4>
      <div className="rounded border border-border bg-surface px-3">
        {meals.map((m) => (
          <div
            key={m.slot}
            className="flex items-baseline justify-between border-b border-border-soft py-3 text-sm last:border-b-0"
          >
            <span className="text-sand-muted">{m.slot}</span>
            <span className="text-sand">{m.selection ?? <span className="text-border">not yet chosen</span>}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** One roster member's slice of one selected day — reached via the day tabs + person filter in plan-dashboard-client.tsx, not a standalone multi-day view. */
export function PersonDayCard({ artistName, day }: { artistName: string; day: PersonDayItinerary | undefined }) {
  if (!day) {
    return <p className="text-sm text-sand-muted">Nothing recorded for {artistName} on this day.</p>;
  }

  const nothingToShow = day.activities.length === 0 && day.meals.length === 0 && day.refreshments.length === 0;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="font-display text-xl text-sand">{artistName}</h2>
        <p className="text-xs text-sand-muted">
          {day.label} · {day.date}
        </p>
      </div>

      {SCHEDULE_GROUP_LABELS.map(({ category, label }) => (
        <ActivityGroup key={label} label={label} activities={day.activities.filter((a) => a.category === category)} />
      ))}

      <MealList label="Meals" meals={day.meals} />
      <MealList label="Refreshments" meals={day.refreshments} />

      {nothingToShow && <p className="text-sm text-sand-muted">Nothing recorded for this day yet.</p>}
    </div>
  );
}
