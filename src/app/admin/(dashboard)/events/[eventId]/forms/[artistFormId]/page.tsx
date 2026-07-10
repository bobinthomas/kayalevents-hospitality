import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { ItinerarySchema } from "@/lib/itinerary-schema";
import { FormSnapshotEditorClient } from "./form-snapshot-editor-client";

export default async function FormDetailPage({
  params,
}: {
  params: Promise<{ eventId: string; artistFormId: string }>;
}) {
  const { eventId, artistFormId } = await params;
  const supabase = await createServerSupabaseClient();

  const { data: form } = await supabase
    .from("artist_forms")
    .select("id, token, form_schema, deadline, artists(name)")
    .eq("id", artistFormId)
    .single();

  if (!form) notFound();

  const artistName = (form.artists as unknown as { name: string } | null)?.name ?? "Artist";

  return (
    <div>
      <h2 className="font-display mb-4 text-lg">{artistName}&rsquo;s form</h2>
      <FormSnapshotEditorClient
        formId={form.id}
        eventId={eventId}
        token={form.token}
        initialSchema={form.form_schema as ItinerarySchema}
        initialDeadline={form.deadline}
      />
    </div>
  );
}
