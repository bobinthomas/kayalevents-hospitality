import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { StatusBadge } from "@/components/admin/status-badge";

export default async function ResponsesPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const supabase = await createServerSupabaseClient();

  const { data: forms } = await supabase
    .from("artist_forms")
    .select("id, status, deadline, submitted_at, artists(name, role)")
    .eq("event_id", eventId)
    .order("created_at", { ascending: true });

  return (
    <ul className="flex flex-col gap-2">
      {(forms ?? []).map((form) => {
        const artist = form.artists as unknown as { name: string; role: string } | null;
        return (
          <li key={form.id}>
            <Link
              href={`/admin/events/${eventId}/responses/${form.id}`}
              className="flex items-center justify-between rounded border border-border bg-surface px-4 py-3 hover:bg-surface-raised"
            >
              <div>
                <span className="font-medium">{artist?.name ?? "Artist"}</span>{" "}
                <span className="text-sm text-sand-muted">{artist?.role}</span>
              </div>
              <StatusBadge status={form.status} deadline={form.deadline} />
            </Link>
          </li>
        );
      })}
      {(forms ?? []).length === 0 && (
        <li className="text-sm text-sand-muted">No forms generated yet.</li>
      )}
    </ul>
  );
}
