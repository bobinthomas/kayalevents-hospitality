import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { specialRequirementsKey, type ItinerarySchema, type ResponseData } from "@/lib/itinerary-schema";
import { sortedSections } from "@/lib/day-type-presets";
import { InfoBlockCard } from "@/components/artist-form/info-block-card";
import { TransportBlockCard } from "@/components/artist-form/transport-block-card";
import { FieldResponseCard } from "@/components/artist-form/field-response-card";
import { StatusBadge } from "@/components/admin/status-badge";
import { PdfExportButton } from "./pdf-export-button";

export default async function ResponseDetailPage({
  params,
}: {
  params: Promise<{ eventId: string; artistFormId: string }>;
}) {
  const { artistFormId } = await params;
  const supabase = await createServerSupabaseClient();

  const { data: form } = await supabase
    .from("artist_forms")
    .select("id, form_schema, response_data, status, deadline, submitted_at, artists(name)")
    .eq("id", artistFormId)
    .single();

  if (!form) notFound();

  const artistName = (form.artists as unknown as { name: string } | null)?.name ?? "Artist";
  const schema = form.form_schema as ItinerarySchema;
  const responseData = form.response_data as ResponseData;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="font-display text-lg">{artistName}</h2>
          {form.submitted_at && (
            <p className="text-sm text-sand-muted">Submitted {new Date(form.submitted_at).toLocaleString()}</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={form.status} deadline={form.deadline} />
          <PdfExportButton artistFormId={form.id} />
        </div>
      </div>

      <div className="flex flex-col gap-6">
        {sortedSections(schema.sections).map((section) => (
          <div key={section.id}>
            <h3 className="mb-2 text-sm font-medium text-sand-muted">
              {section.label} · {section.date}
            </h3>
            <div className="flex flex-col gap-3">
              {section.blocks.map((block) => {
                if (block.kind === "info") return <InfoBlockCard key={block.id} block={block} />;
                if (block.kind === "transport") return <TransportBlockCard key={block.id} block={block} />;
                return (
                  <FieldResponseCard
                    key={block.id}
                    block={block}
                    value={responseData[block.id]}
                    notesValue={responseData[specialRequirementsKey(block.id)] as string | undefined}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
