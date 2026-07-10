import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { ItineraryPdfDocument } from "@/lib/pdf/itinerary-pdf-document";
import type { ItinerarySchema, ResponseData } from "@/lib/itinerary-schema";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Auth-gated: RLS scopes this select to the signed-in admin's own events.
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: form, error } = await supabase
    .from("artist_forms")
    .select("id, event_id, form_schema, response_data, artists(name), events(name)")
    .eq("id", id)
    .single();

  if (error || !form) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const artistName = (form.artists as unknown as { name: string } | null)?.name ?? "Artist";
  const eventName = (form.events as unknown as { name: string } | null)?.name ?? "Event";

  try {
    const buffer = await renderToBuffer(
      <ItineraryPdfDocument
        artistName={artistName}
        eventName={eventName}
        schema={form.form_schema as ItinerarySchema}
        responseData={form.response_data as ResponseData}
      />
    );

    const admin = createAdminSupabaseClient();
    const path = `${form.event_id}/${form.id}.pdf`;
    const { error: uploadError } = await admin.storage
      .from("hospitality-exports")
      .upload(path, buffer, { contentType: "application/pdf", upsert: true });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const { data: signed, error: signError } = await admin.storage
      .from("hospitality-exports")
      .createSignedUrl(path, 60 * 60);

    if (signError || !signed) {
      return NextResponse.json({ error: signError?.message ?? "Failed to sign URL" }, { status: 500 });
    }

    return NextResponse.json({ url: signed.signedUrl });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "PDF generation failed" },
      { status: 500 }
    );
  }
}
