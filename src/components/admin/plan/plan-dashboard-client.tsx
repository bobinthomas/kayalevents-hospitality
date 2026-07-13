"use client";

import { useState } from "react";
import type { AttentionItem, DaySection as DaySectionData, PersonItinerary, StatusStripMetrics } from "@/lib/plan-view-model";
import { StatusStrip } from "./status-strip";
import { AttentionPanel } from "./attention-panel";
import { DaySection } from "./day-section";
import { DayTabs } from "./day-tabs";
import { PersonFilter } from "./person-filter";
import { PersonDayCard } from "./person-day-card";

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
  const [selectedDay, setSelectedDay] = useState<string | null>(() => nextUpcomingDayLabel(days));
  const [selectedPerson, setSelectedPerson] = useState<string | null>(null);

  const currentDay = days.find((d) => d.label === selectedDay) ?? null;
  const currentPersonDay = selectedPerson
    ? personItineraries[selectedPerson]?.days.find((d) => d.label === selectedDay)
    : undefined;

  return (
    <div className="flex flex-col gap-6">
      <StatusStrip metrics={statusStrip} />

      {days.length > 0 && <DayTabs days={days} selected={selectedDay} onSelect={setSelectedDay} />}

      <AttentionPanel items={attentionItems} eventId={eventId} />

      <PersonFilter people={Object.keys(personItineraries)} selected={selectedPerson} onSelect={setSelectedPerson} />

      {selectedPerson ? (
        <PersonDayCard artistName={selectedPerson} day={currentPersonDay} />
      ) : currentDay ? (
        <DaySection day={currentDay} />
      ) : (
        <p className="text-sm text-sand-muted">No days scheduled yet.</p>
      )}
    </div>
  );
}
