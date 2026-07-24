import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { StatusBadge } from "@/components/admin/status-badge";
import { GenerateFormButton } from "./generate-form-button";
import { CopyPlanControl } from "./copy-plan-control";
import { ResetToTemplateControl } from "./reset-to-template-control";

export default async function FormsPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const supabase = await createServerSupabaseClient();

  const { data: artists } = await supabase
    .from("artists")
    .select("id, name, role")
    .eq("event_id", eventId)
    .order("created_at", { ascending: true });

  const { data: forms } = await supabase
    .from("artist_forms")
    .select("id, artist_id, status, deadline, created_at")
    .eq("event_id", eventId)
    .order("created_at", { ascending: false });

  const latestFormByArtist = new Map<string, NonNullable<typeof forms>[number]>();
  for (const form of forms ?? []) {
    if (!latestFormByArtist.has(form.artist_id)) latestFormByArtist.set(form.artist_id, form);
  }

  const artistNameById = new Map((artists ?? []).map((a) => [a.id, a.name]));
  const allFormIds = [...latestFormByArtist.values()].map((f) => f.id);

  return (
    <div className="flex flex-col gap-3">
      {allFormIds.length > 0 && (
        <div className="flex justify-end">
          <ResetToTemplateControl eventId={eventId} formIds={allFormIds} label="Reset all forms to template" />
        </div>
      )}
      <ul className="flex flex-col gap-2">
      {(artists ?? []).map((artist) => {
        const form = latestFormByArtist.get(artist.id);
        const copySources = [...latestFormByArtist.entries()]
          .filter(([artistId]) => artistId !== artist.id)
          .map(([artistId, f]) => ({ formId: f.id, artistName: artistNameById.get(artistId) ?? "Unknown" }));
        return (
          <li
            key={artist.id}
            className="flex items-center justify-between rounded border border-border bg-surface px-4 py-3"
          >
            <div>
              <span className="font-medium">{artist.name}</span>{" "}
              <span className="text-sm text-sand-muted">{artist.role}</span>
            </div>
            <div className="flex items-center gap-3">
              {form ? (
                <>
                  <StatusBadge status={form.status} deadline={form.deadline} />
                  <Link
                    href={`/admin/events/${eventId}/forms/${form.id}`}
                    className="text-sm text-ocean hover:underline"
                  >
                    Edit
                  </Link>
                  <ResetToTemplateControl eventId={eventId} formIds={[form.id]} label="Reset" />
                </>
              ) : (
                <GenerateFormButton eventId={eventId} artistId={artist.id} />
              )}
              <CopyPlanControl
                eventId={eventId}
                targetArtistId={artist.id}
                sources={copySources}
                hasExistingForm={Boolean(form)}
              />
            </div>
          </li>
        );
      })}
      {(artists ?? []).length === 0 && (
        <li className="text-sm text-sand-muted">Add artists to the roster first.</li>
      )}
      </ul>
    </div>
  );
}
