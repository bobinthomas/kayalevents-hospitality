import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { ItinerarySchema, ResponseData } from "@/lib/itinerary-schema";
import { buildNonResponders, buildPlan, type ArtistFormInput } from "@/lib/plan-aggregation";
import { NonRespondersCard } from "@/components/admin/plan/non-responders-card";
import { DayScheduleTable } from "@/components/admin/plan/day-schedule-table";
import { ChoiceTallyCard } from "@/components/admin/plan/choice-tally-card";
import { FreeTextListCard } from "@/components/admin/plan/free-text-list-card";

export default async function PlanPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  const supabase = await createServerSupabaseClient();

  const { data: forms } = await supabase
    .from("artist_forms")
    .select("form_schema, response_data, status, submitted_at, deadline, artists(name, role, phone, email)")
    .eq("event_id", eventId);

  const rows = (forms ?? []).map((form) => {
    const artist = form.artists as unknown as {
      name: string;
      role: string;
      phone: string | null;
      email: string | null;
    } | null;
    return {
      artistName: artist?.name ?? "Artist",
      artistRole: artist?.role ?? "",
      hasResponded: form.submitted_at !== null,
      schema: form.form_schema as ItinerarySchema,
      responseData: form.response_data as ResponseData,
      phone: artist?.phone ?? null,
      email: artist?.email ?? null,
      status: form.status,
      deadline: form.deadline,
    };
  });

  const days = buildPlan(rows as ArtistFormInput[]);
  const nonResponders = buildNonResponders(rows);

  if (rows.length === 0) {
    return <p className="text-sm text-sand-muted">No forms generated yet — nothing to plan around.</p>;
  }

  return (
    <div className="flex flex-col gap-8">
      <NonRespondersCard nonResponders={nonResponders} />

      {days.map((day) => (
        <div key={day.label} className="overflow-hidden rounded-lg border border-border-soft">
          <div className="border-b-2 border-lagoon bg-surface-raised px-4 py-3">
            <h2 className="font-display text-xl text-sand">{day.label}</h2>
            <p className="text-xs text-sand-muted">{day.date}</p>
          </div>
          <div className="flex flex-col gap-4 p-4">
            <DayScheduleTable entries={day.schedule} />

            {day.choices.length > 0 && (
              <div>
                <h3 className="mb-2 text-sm font-medium text-sand-muted">Meals &amp; refreshments</h3>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {day.choices.map((choice) => (
                    <ChoiceTallyCard key={choice.title} choice={choice} />
                  ))}
                </div>
              </div>
            )}

            {day.freeText.length > 0 && (
              <div>
                <h3 className="mb-2 text-sm font-medium text-sand-muted">Notes &amp; duties</h3>
                <div className="flex flex-col gap-3">
                  {day.freeText.map((group) => (
                    <FreeTextListCard key={group.title} group={group} />
                  ))}
                </div>
              </div>
            )}

            {day.schedule.length === 0 && day.choices.length === 0 && day.freeText.length === 0 && (
              <p className="text-sm text-sand-muted">Nothing recorded for this day yet.</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
