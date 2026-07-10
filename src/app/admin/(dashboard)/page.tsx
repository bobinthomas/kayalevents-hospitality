import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createEvent } from "./events/actions";

export default async function EventsPage() {
  const supabase = await createServerSupabaseClient();
  const { data: events } = await supabase
    .from("events")
    .select("id, name, location, start_date, end_date")
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display mb-6 text-xl">Events</h1>

      <ul className="mb-8 flex flex-col gap-2">
        {(events ?? []).map((event) => (
          <li key={event.id}>
            <Link
              href={`/admin/events/${event.id}/roster`}
              className="block rounded border border-border bg-surface px-4 py-3 hover:bg-surface-raised"
            >
              <div className="font-medium">{event.name}</div>
              <div className="text-sm text-sand-muted">
                {event.location ?? "—"}
                {event.start_date ? ` · ${event.start_date}` : ""}
                {event.end_date ? ` → ${event.end_date}` : ""}
              </div>
            </Link>
          </li>
        ))}
        {(events ?? []).length === 0 && (
          <li className="text-sm text-sand-muted">No events yet.</li>
        )}
      </ul>

      <details className="rounded border border-border bg-surface p-4">
        <summary className="cursor-pointer font-medium">New event</summary>
        <form action={createEvent} className="mt-4 flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm text-sand-muted">
            Name
            <input name="name" required className="rounded border border-border bg-marine-black px-3 py-2 text-sand" />
          </label>
          <label className="flex flex-col gap-1 text-sm text-sand-muted">
            Location
            <input name="location" className="rounded border border-border bg-marine-black px-3 py-2 text-sand" />
          </label>
          <div className="flex gap-3">
            <label className="flex flex-1 flex-col gap-1 text-sm text-sand-muted">
              Start date
              <input type="date" name="start_date" className="rounded border border-border bg-marine-black px-3 py-2 text-sand" />
            </label>
            <label className="flex flex-1 flex-col gap-1 text-sm text-sand-muted">
              End date
              <input type="date" name="end_date" className="rounded border border-border bg-marine-black px-3 py-2 text-sand" />
            </label>
          </div>
          <button type="submit" className="rounded bg-coral px-3 py-2 text-sand hover:bg-coral-bright">
            Create event
          </button>
        </form>
      </details>
    </div>
  );
}
