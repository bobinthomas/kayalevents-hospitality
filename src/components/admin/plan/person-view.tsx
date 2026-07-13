import type { ActivityRow, PersonDayItinerary, PersonItinerary, ScheduleCategory } from "@/lib/plan-view-model";

const SCHEDULE_GROUPS: { category: ScheduleCategory | null; label: string }[] = [
  { category: null, label: "Other" },
  { category: "travel", label: "Travel (Flights)" },
  { category: "transportation", label: "Transportation (To & Fro)" },
];

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
      <ul className="flex flex-col gap-1 text-sm">
        {meals.map((m) => (
          <li key={m.slot} className="flex items-baseline justify-between">
            <span className="text-sand-muted">{m.slot}</span>
            <span className="text-sand">{m.selection ?? <span className="text-border">not yet chosen</span>}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Same underlying data as the day view, just sliced down to one roster member's own rows — this is what gets shared with an artist, who only cares about their own itinerary. */
export function PersonView({ person }: { person: PersonItinerary }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl text-sand">{person.artistName}</h2>
          <p className="text-xs text-sand-muted">{person.artistRole}</p>
        </div>
        <span
          className={`rounded-full px-2 py-0.5 text-xs ${
            person.hasResponded ? "bg-lagoon/20 text-lagoon-bright" : "bg-surface-raised text-sand-muted"
          }`}
        >
          {person.hasResponded ? "Confirmed" : "Not yet submitted"}
        </span>
      </div>

      {person.days.map((day) => (
        <div key={day.label} className="overflow-hidden rounded-lg border border-border-soft">
          <div className="border-b-2 border-lagoon bg-surface-raised px-4 py-3">
            <h3 className="font-display text-lg text-sand">{day.label}</h3>
            <p className="text-xs text-sand-muted">{day.date}</p>
          </div>
          <div className="flex flex-col gap-4 p-4">
            {SCHEDULE_GROUPS.map(({ category, label }) => (
              <ActivityGroup
                key={label}
                label={label}
                activities={day.activities.filter((a) => a.category === category)}
              />
            ))}

            <MealList label="Meals" meals={day.meals} />
            <MealList label="Refreshments" meals={day.refreshments} />

            {day.activities.length === 0 && day.meals.length === 0 && day.refreshments.length === 0 && (
              <p className="text-sm text-sand-muted">Nothing recorded for this day yet.</p>
            )}
          </div>
        </div>
      ))}

      {person.days.length === 0 && <p className="text-sm text-sand-muted">No days scheduled yet.</p>}
    </div>
  );
}
