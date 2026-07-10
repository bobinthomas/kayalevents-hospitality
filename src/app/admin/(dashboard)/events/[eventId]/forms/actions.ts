"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { generateFormToken } from "@/lib/token";
import type { ItinerarySchema } from "@/lib/itinerary-schema";

export interface GenerateFormState {
  error?: string;
}

export async function generateFormForArtist(
  eventId: string,
  _prevState: GenerateFormState | null,
  formData: FormData
): Promise<GenerateFormState> {
  const artistId = String(formData.get("artist_id") ?? "");
  if (!artistId) return { error: "Artist is required" };

  const supabase = await createServerSupabaseClient();

  const { data: artist, error: artistError } = await supabase
    .from("artists")
    .select("role")
    .eq("id", artistId)
    .single();
  if (artistError) return { error: artistError.message };

  const { data: template, error: templateError } = await supabase
    .from("templates")
    .select("id, schema")
    .eq("event_id", eventId)
    .eq("role", artist.role)
    .maybeSingle();
  if (templateError) return { error: templateError.message };
  if (!template) {
    return { error: `No template seeded for role "${artist.role}" yet — seed it in the Templates tab first.` };
  }

  const { data: form, error: formError } = await supabase
    .from("artist_forms")
    .insert({
      event_id: eventId,
      artist_id: artistId,
      source_template_id: template.id,
      token: generateFormToken(),
      form_schema: template.schema,
    })
    .select("id")
    .single();
  if (formError) return { error: formError.message };

  revalidatePath(`/admin/events/${eventId}/forms`);
  redirect(`/admin/events/${eventId}/forms/${form.id}`);
}

export async function saveFormSnapshot(formId: string, eventId: string, schema: ItinerarySchema) {
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from("artist_forms").update({ form_schema: schema }).eq("id", formId);
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/events/${eventId}/forms/${formId}`);
}

export async function setFormDeadline(formId: string, eventId: string, deadline: string) {
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from("artist_forms")
    .update({ deadline: deadline || null, status: "sent" })
    .eq("id", formId);
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/events/${eventId}/forms/${formId}`);
  revalidatePath(`/admin/events/${eventId}/forms`);
}
