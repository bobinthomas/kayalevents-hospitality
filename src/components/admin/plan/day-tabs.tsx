import type { DaySection as DaySectionData } from "@/lib/plan-view-model";

/** Locale is pinned (not `undefined`) — an ambient/OS locale can differ between the Node server that renders this first and the browser that hydrates it, which throws a React hydration mismatch (e.g. server "6 Aug" vs. client "Aug 6"). */
function formatShortDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-AU", { month: "short", day: "numeric" });
}

/** Main navigation for the Plan dashboard — one tab per day, showing its date. Sits directly under the status strip cards; which day is selected drives everything rendered below (the day's full content, or a single person's slice of it). */
export function DayTabs({
  days,
  selected,
  onSelect,
}: {
  days: DaySectionData[];
  selected: string | null;
  onSelect: (label: string) => void;
}) {
  return (
    <div className="flex gap-1 overflow-x-auto border-b border-border">
      {days.map((day) => {
        const active = day.label === selected;
        const allConfirmed = day.totalPeople > 0 && day.confirmedCount === day.totalPeople;
        return (
          <button
            key={day.label}
            type="button"
            onClick={() => onSelect(day.label)}
            aria-current={active}
            className={`flex shrink-0 flex-col items-center gap-0.5 border-b-2 px-4 py-2 ${
              active
                ? "border-coral text-sand"
                : "border-transparent text-sand-muted hover:border-lagoon hover:text-sand"
            }`}
          >
            <span className="text-sm font-medium">{formatShortDate(day.date)}</span>
            <span className="text-xs">{day.label}</span>
            <span className={`text-[10px] ${allConfirmed ? "text-lagoon-bright" : "text-sand-muted"}`}>
              {day.confirmedCount}/{day.totalPeople}
            </span>
          </button>
        );
      })}
    </div>
  );
}
