"use client";

import { useState } from "react";
import type { AttentionItem, DaySection as DaySectionData, PersonItinerary, StatusStripMetrics } from "@/lib/plan-view-model";
import { StatusStrip } from "./status-strip";
import { AttentionPanel } from "./attention-panel";
import { DaySection } from "./day-section";
import { ViewToggle, type PlanView } from "./view-toggle";
import { PersonView } from "./person-view";

function nextUpcomingDayLabel(days: DaySectionData[]): string | null {
  const todayIso = new Date().toISOString().slice(0, 10);
  return (days.find((d) => d.date >= todayIso) ?? days[0])?.label ?? null;
}

export function PlanDashboardClient({
  eventId,
  days,
  attentionItems,
  statusStrip,
  personItineraries,
}: {
  eventId: string;
  days: DaySectionData[];
  attentionItems: AttentionItem[];
  statusStrip: StatusStripMetrics;
  personItineraries: Record<string, PersonItinerary>;
}) {
  const [view, setView] = useState<PlanView>("day");
  const [selectedPerson, setSelectedPerson] = useState<string | null>(Object.keys(personItineraries)[0] ?? null);
  const [expandedDays, setExpandedDays] = useState<Set<string>>(() => {
    const autoExpand = nextUpcomingDayLabel(days);
    return new Set(autoExpand ? [autoExpand] : []);
  });

  function toggleDay(label: string) {
    setExpandedDays((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <StatusStrip metrics={statusStrip} />
        <ViewToggle view={view} onChange={setView} />
      </div>

      {view === "day" ? (
        <div className="flex flex-col gap-6">
          <AttentionPanel items={attentionItems} eventId={eventId} />
          {days.map((day) => (
            <DaySection
              key={day.label}
              day={day}
              expanded={expandedDays.has(day.label)}
              onToggle={() => toggleDay(day.label)}
            />
          ))}
          {days.length === 0 && <p className="text-sm text-sand-muted">No days scheduled yet.</p>}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <select
            value={selectedPerson ?? ""}
            onChange={(e) => setSelectedPerson(e.target.value)}
            className="w-fit rounded border border-border bg-marine-black px-3 py-1.5 text-sm text-sand"
          >
            {Object.values(personItineraries).map((p) => (
              <option key={p.artistName} value={p.artistName}>
                {p.artistName} ({p.artistRole})
              </option>
            ))}
          </select>
          {selectedPerson && personItineraries[selectedPerson] ? (
            <PersonView person={personItineraries[selectedPerson]} />
          ) : (
            <p className="text-sm text-sand-muted">No roster members with a generated form yet.</p>
          )}
        </div>
      )}
    </div>
  );
}
