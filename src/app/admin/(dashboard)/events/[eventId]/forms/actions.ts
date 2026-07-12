"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { generateFormToken } from "@/lib/token";
import { cloneSchemaWithFreshIds, type ItinerarySchema } from "@/lib/itinerary-schema";

export interface GenerateFormState {
  error?: string;
}

export interface CopyPlanState {
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

/**
 * Copies another artist's plan (form_schema only — times, logistics blocks,
 * transport, food slots) onto this artist's form, for artists travelling
 * together on an identical itinerary. Response data is never touched: if the
 * target already has a form, only its schema is overwritten so any answers
 * already submitted against the old schema are left as-is (though they'll
 * likely need re-review since the block ids underneath just changed).
 */
export async function copyFormPlan(
  eventId: string,
  targetArtistId: string,
  _prevState: CopyPlanState | null,
  formData: FormData
): Promise<CopyPlanState> {
  const sourceFormId = String(formData.get("source_form_id") ?? "");
  if (!sourceFormId) return { error: "Pick an artist to copy from" };

  const supabase = await createServerSupabaseClient();

  const { data: source, error: sourceError } = await supabase
    .from("artist_forms")
    .select("form_schema, source_template_id")
    .eq("id", sourceFormId)
    .single();
  if (sourceError || !source) return { error: sourceError?.message ?? "Source form not found" };

  const clonedSchema = cloneSchemaWithFreshIds(source.form_schema as ItinerarySchema);

  const { data: existing } = await supabase
    .from("artist_forms")
    .select("id")
    .eq("event_id", eventId)
    .eq("artist_id", targetArtistId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let targetFormId: string;
  if (existing) {
    const { error } = await supabase
      .from("artist_forms")
      .update({ form_schema: clonedSchema })
      .eq("id", existing.id);
    if (error) return { error: error.message };
    targetFormId = existing.id;
  } else {
    const { data: form, error } = await supabase
      .from("artist_forms")
      .insert({
        event_id: eventId,
        artist_id: targetArtistId,
        source_template_id: source.source_template_id,
        token: generateFormToken(),
        form_schema: clonedSchema,
      })
      .select("id")
      .single();
    if (error) return { error: error.message };
    targetFormId = form.id;
  }

  revalidatePath(`/admin/events/${eventId}/forms`);
  redirect(`/admin/events/${eventId}/forms/${targetFormId}`);
}
