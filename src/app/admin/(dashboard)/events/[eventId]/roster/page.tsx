import { createServerSupabaseClient } from "@/lib/supabase/server";
import { addArtist } from "./actions";

const ROLE_LABELS: Record<string, string> = {
  lead: "Lead artist",
  band: "Band",
  musician: "Musician",
  crew: "Crew",
};

export default async function RosterPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: artists } = await supabase
    .from("artists")
    .select("id, name, role, is_vip, phone, email")
    .eq("event_id", eventId)
    .order("created_at", { ascending: true });

  const addArtistWithEventId = addArtist.bind(null, eventId);

  return (
    <div>
      <ul className="mb-8 flex flex-col gap-2">
        {(artists ?? []).map((artist) => (
          <li
            key={artist.id}
            className="flex items-center justify-between rounded border border-border bg-surface px-4 py-3"
          >
            <div>
              <span className="font-medium">{artist.name}</span>{" "}
              <span className="text-sm text-sand-muted">
                {ROLE_LABELS[artist.role] ?? artist.role}
              </span>
            </div>
            {artist.is_vip && (
              <span className="rounded-full bg-gold/20 px-2 py-0.5 text-xs font-medium text-gold-bright">
                VIP
              </span>
            )}
          </li>
        ))}
        {(artists ?? []).length === 0 && (
          <li className="text-sm text-sand-muted">No artists added yet.</li>
        )}
      </ul>

      <details className="rounded border border-border bg-surface p-4">
        <summary className="cursor-pointer font-medium">Add artist</summary>
        <form action={addArtistWithEventId} className="mt-4 flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm text-sand-muted">
            Name
            <input name="name" required className="rounded border border-border bg-marine-black px-3 py-2 text-sand" />
          </label>
          <label className="flex flex-col gap-1 text-sm text-sand-muted">
            Type
            <select name="role" required className="rounded border border-border bg-marine-black px-3 py-2 text-sand">
              <option value="lead">Lead artist</option>
              <option value="band">Band</option>
              <option value="musician">Musician</option>
              <option value="crew">Crew</option>
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm text-sand-muted">
            <input type="checkbox" name="is_vip" />
            VIP
          </label>
          <p className="-mt-2 text-xs text-sand-muted">Applies hospitality upgrades.</p>
          <label className="flex flex-col gap-1 text-sm text-sand-muted">
            Phone
            <input name="phone" className="rounded border border-border bg-marine-black px-3 py-2 text-sand" />
          </label>
          <label className="flex flex-col gap-1 text-sm text-sand-muted">
            Email
            <input type="email" name="email" className="rounded border border-border bg-marine-black px-3 py-2 text-sand" />
          </label>
          <button type="submit" className="rounded bg-coral px-3 py-2 text-sand hover:bg-coral-bright">
            Add artist
          </button>
        </form>
      </details>
    </div>
  );
}
