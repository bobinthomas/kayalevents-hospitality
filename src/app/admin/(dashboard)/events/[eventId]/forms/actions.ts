"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { generateFormToken } from "@/lib/token";
import { cloneSchemaWithFreshIds, syncResponseDataToTemplate, type ItinerarySchema, type ResponseData } from "@/lib/itinerary-schema";

export interface GenerateFormState {
  error?: string;
}

export interface CopyPlanState {
  error?: string;
}

export type ResetMode = "structure" | "full";

export interface ResetFormsState {
  error?: string;
  updated?: number;
  schemas?: Record<string, ItinerarySchema>;
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

/**
 * Resets one or more artist forms back onto their role's current template —
 * the fix for a form generated before a later template edit, which otherwise
 * has no way to pick up that change. "structure" keeps existing answers,
 * remapped onto the template's block ids via `syncResponseDataToTemplate`;
 * "full" discards all answers and re-opens the form for re-submission.
 * Looks the template up by the artist's role (same lookup `generateFormForArtist`
 * uses) rather than trusting each form's `source_template_id`, since that can
 * be null on forms created via `copyFormPlan` cloning from another artist.
 * Forms whose role has no seeded template are skipped, not failed, so a
 * partial roster (some roles not yet templated) can still reset the rest.
 */
export async function resetFormsToTemplate(
  eventId: string,
  formIds: string[],
  mode: ResetMode
): Promise<ResetFormsState> {
  if (formIds.length === 0) return { error: "No forms to reset" };

  const supabase = await createServerSupabaseClient();

  const { data: forms, error: formsError } = await supabase
    .from("artist_forms")
    .select("id, form_schema, response_data, status, artists(role)")
    .eq("event_id", eventId)
    .in("id", formIds);
  if (formsError) return { error: formsError.message };
  if (!forms || forms.length === 0) return { error: "Forms not found" };

  const roles = [...new Set(forms.map((form) => (form.artists as unknown as { role: string }).role))];
  const { data: templates, error: templatesError } = await supabase
    .from("templates")
    .select("id, role, schema")
    .eq("event_id", eventId)
    .in("role", roles);
  if (templatesError) return { error: templatesError.message };

  const templateByRole = new Map((templates ?? []).map((template) => [template.role, template]));

  const schemas: Record<string, ItinerarySchema> = {};
  let updated = 0;

  for (const form of forms) {
    const role = (form.artists as unknown as { role: string }).role;
    const template = templateByRole.get(role);
    if (!template) continue;

    const templateSchema = template.schema as ItinerarySchema;
    const nextSchema: ItinerarySchema = JSON.parse(JSON.stringify(templateSchema));
    const nextResponseData: ResponseData =
      mode === "structure"
        ? syncResponseDataToTemplate(templateSchema, form.form_schema as ItinerarySchema, form.response_data as ResponseData)
        : {};

    const update: Record<string, unknown> = {
      form_schema: nextSchema,
      response_data: nextResponseData,
      source_template_id: template.id,
    };
    if (mode === "full") {
      update.submitted_at = null;
      update.opened_at = null;
      if (form.status === "submitted" || form.status === "locked") update.status = "sent";
    }

    const { error } = await supabase.from("artist_forms").update(update).eq("id", form.id);
    if (error) return { error: error.message };

    schemas[form.id] = nextSchema;
    updated += 1;
  }

  revalidatePath(`/admin/events/${eventId}/forms`);
  for (const formId of formIds) revalidatePath(`/admin/events/${eventId}/forms/${formId}`);
  revalidatePath(`/admin/events/${eventId}/plan`);

  return { updated, schemas };
}
