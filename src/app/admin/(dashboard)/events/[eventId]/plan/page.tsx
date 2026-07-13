import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { ItinerarySchema, ResponseData } from "@/lib/itinerary-schema";
import {
  buildAttentionItems,
  buildDaySections,
  buildPersonItinerary,
  buildStatusStrip,
  type FormRecord,
  type PersonItinerary,
  type RosterMember,
} from "@/lib/plan-view-model";
import { PlanDashboardClient } from "@/components/admin/plan/plan-dashboard-client";

export default async function PlanPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  const supabase = await createServerSupabaseClient();

  const { data: artists } = await supabase
    .from("artists")
    .select("id, name, role, phone, email")
    .eq("event_id", eventId)
    .order("created_at", { ascending: true });

  const roster: RosterMember[] = (artists ?? []).map((a) => ({
    artistId: a.id,
    artistName: a.name,
    artistRole: a.role,
    phone: a.phone,
    email: a.email,
  }));

  if (roster.length === 0) {
    return <p className="text-sm text-sand-muted">Add artists to the roster first — nothing to plan around yet.</p>;
  }

  const { data: rawForms } = await supabase
    .from("artist_forms")
    .select("id, artist_id, status, deadline, updated_at, opened_at, submitted_at, form_schema, response_data, artists(name, role)")
    .eq("event_id", eventId);

  const forms: FormRecord[] = (rawForms ?? []).map((f) => {
    const artist = f.artists as unknown as { name: string; role: string } | null;
    return {
      formId: f.id,
      artistId: f.artist_id,
      artistName: artist?.name ?? "Artist",
      artistRole: artist?.role ?? "",
      status: f.status,
      hasResponded: f.submitted_at !== null,
      deadline: f.deadline,
      updatedAt: f.updated_at,
      openedAt: f.opened_at,
      submittedAt: f.submitted_at,
      schema: f.form_schema as ItinerarySchema,
      responseData: f.response_data as ResponseData,
    };
  });

  if (forms.length === 0) {
    return <p className="text-sm text-sand-muted">No forms generated yet — nothing to plan around.</p>;
  }

  const days = buildDaySections(forms, roster);
  const attentionItems = buildAttentionItems(forms, days);
  const statusStrip = buildStatusStrip(roster, forms, days, attentionItems);

  const personItineraries: Record<string, PersonItinerary> = {};
  for (const form of forms) {
    const itinerary = buildPersonItinerary(form.artistName, forms, days);
    if (itinerary) personItineraries[form.artistName] = itinerary;
  }

  return (
    <PlanDashboardClient
      eventId={eventId}
      days={days}
      attentionItems={attentionItems}
      statusStrip={statusStrip}
      personItineraries={personItineraries}
    />
  );
}
