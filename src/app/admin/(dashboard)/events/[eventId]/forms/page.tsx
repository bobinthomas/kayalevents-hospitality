import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { StatusBadge } from "@/components/admin/status-badge";
import { GenerateFormButton } from "./generate-form-button";

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

  return (
    <ul className="flex flex-col gap-2">
      {(artists ?? []).map((artist) => {
        const form = latestFormByArtist.get(artist.id);
        return (
          <li
            key={artist.id}
            className="flex items-center justify-between rounded border border-border bg-surface px-4 py-3"
          >
            <div>
              <span className="font-medium">{artist.name}</span>{" "}
              <span className="text-sm text-sand-muted">{artist.role}</span>
            </div>
            {form ? (
              <div className="flex items-center gap-3">
                <StatusBadge status={form.status} deadline={form.deadline} />
                <Link
                  href={`/admin/events/${eventId}/forms/${form.id}`}
                  className="text-sm text-ocean hover:underline"
                >
                  Edit
                </Link>
              </div>
            ) : (
              <GenerateFormButton eventId={eventId} artistId={artist.id} />
            )}
          </li>
        );
      })}
      {(artists ?? []).length === 0 && (
        <li className="text-sm text-sand-muted">Add artists to the roster first.</li>
      )}
    </ul>
  );
}
