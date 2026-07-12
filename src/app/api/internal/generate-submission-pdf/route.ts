import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { generateFormPdfBuffer } from "@/lib/pdf/generate-form-pdf";
import { getRuntimeEnv } from "@/lib/runtime-env";
import type { ItinerarySchema, ResponseData } from "@/lib/itinerary-schema";

/**
 * Server-to-server only — called by the submit-form Supabase Edge Function
 * right after an artist submits, never by a browser. Auth is a shared
 * secret header (there's no admin session in that context) rather than the
 * usual `createServerSupabaseClient().auth.getUser()` check.
 *
 * Pre-warms the same "hospitality-exports" storage path the admin's manual
 * PDF export button (`/api/admin/forms/[id]/pdf`) uses, so by the time an
 * admin opens the form and clicks Export, the PDF is already sitting there.
 */
export async function POST(request: NextRequest) {
  const expectedSecret = getRuntimeEnv("INTERNAL_API_SECRET");
  const providedSecret = request.headers.get("x-internal-secret");
  if (!expectedSecret || providedSecret !== expectedSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { formId } = (await request.json().catch(() => ({}))) as { formId?: string };
  if (!formId) {
    return NextResponse.json({ error: "formId is required" }, { status: 400 });
  }

  const admin = createAdminSupabaseClient();
  const { data: form, error } = await admin
    .from("artist_forms")
    .select("event_id, form_schema, response_data, artists(name), events(name)")
    .eq("id", formId)
    .single();

  if (error || !form) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const artistName = (form.artists as unknown as { name: string } | null)?.name ?? "Artist";
  const eventName = (form.events as unknown as { name: string } | null)?.name ?? "Event";

  const buffer = await generateFormPdfBuffer({
    artistName,
    eventName,
    schema: form.form_schema as ItinerarySchema,
    responseData: form.response_data as ResponseData,
  });

  const path = `${form.event_id}/${formId}.pdf`;
  const { error: uploadError } = await admin.storage
    .from("hospitality-exports")
    .upload(path, buffer, { contentType: "application/pdf", upsert: true });

  if (uploadError) {
    console.error("generate-submission-pdf upload failed", uploadError.message);
    return NextResponse.json({ ok: false, error: uploadError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
