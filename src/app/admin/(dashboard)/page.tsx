import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getCurrentUserRole } from "@/lib/supabase/roles";
import { createEvent, assignEventUser, unassignEventUser } from "./events/actions";

export default async function EventsPage() {
  const role = await getCurrentUserRole();

  if (role === "event_user") {
    return <EventUserHome />;
  }

  if (role !== "admin") {
    return (
      <div className="mx-auto max-w-2xl text-sm text-sand-muted">
        This account isn&apos;t fully set up yet — ask an admin to assign you to an event.
      </div>
    );
  }

  return <AdminHome />;
}

async function EventUserHome() {
  const supabase = await createServerSupabaseClient();
  const { data: events } = await supabase
    .from("events")
    .select("id, name, location, start_date, end_date")
    .order("created_at", { ascending: false });

  if ((events ?? []).length === 1) {
    redirect(`/admin/events/${events![0].id}/roster`);
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display mb-6 text-xl">Your events</h1>
      <ul className="flex flex-col gap-2">
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
          <li className="text-sm text-sand-muted">No events assigned yet.</li>
        )}
      </ul>
    </div>
  );
}

async function AdminHome() {
  const supabase = await createServerSupabaseClient();
  const { data: events } = await supabase
    .from("events")
    .select("id, name, location, start_date, end_date, assigned_user_id")
    .order("created_at", { ascending: false });

  const assignedIds = [...new Set((events ?? []).map((e) => e.assigned_user_id).filter((id): id is string => !!id))];
  const admin = createAdminSupabaseClient();
  const emailById = new Map<string, string>();
  await Promise.all(
    assignedIds.map(async (id) => {
      const { data } = await admin.auth.admin.getUserById(id);
      if (data.user?.email) emailById.set(id, data.user.email);
    })
  );

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display mb-6 text-xl">Events</h1>

      <ul className="mb-8 flex flex-col gap-2">
        {(events ?? []).map((event) => (
          <li key={event.id} className="rounded border border-border bg-surface px-4 py-3">
            <Link href={`/admin/events/${event.id}/roster`} className="block hover:underline">
              <div className="font-medium">{event.name}</div>
              <div className="text-sm text-sand-muted">
                {event.location ?? "—"}
                {event.start_date ? ` · ${event.start_date}` : ""}
                {event.end_date ? ` → ${event.end_date}` : ""}
              </div>
            </Link>

            <div className="mt-2 text-sm text-sand-muted">
              {event.assigned_user_id ? (
                <span>
                  Assigned to <span className="text-sand">{emailById.get(event.assigned_user_id) ?? "unknown"}</span>
                </span>
              ) : (
                <span>Unassigned</span>
              )}
            </div>

            <details className="mt-2">
              <summary className="cursor-pointer text-sm text-lagoon">
                {event.assigned_user_id ? "Reassign / change password" : "Assign user"}
              </summary>
              <form action={assignEventUser} className="mt-3 flex flex-col gap-3">
                <input type="hidden" name="event_id" value={event.id} />
                <label className="flex flex-col gap-1 text-sm text-sand-muted">
                  Email
                  <input
                    type="email"
                    name="email"
                    required
                    defaultValue={event.assigned_user_id ? emailById.get(event.assigned_user_id) : ""}
                    className="rounded border border-border bg-marine-black px-3 py-2 text-sand"
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm text-sand-muted">
                  Password
                  <input
                    type="password"
                    name="password"
                    required
                    className="rounded border border-border bg-marine-black px-3 py-2 text-sand"
                  />
                </label>
                <div className="flex gap-2">
                  <button type="submit" className="rounded bg-coral px-3 py-2 text-sand hover:bg-coral-bright">
                    Save
                  </button>
                  {event.assigned_user_id && (
                    <button
                      type="submit"
                      formAction={unassignEventUser}
                      formNoValidate
                      className="rounded border border-border px-3 py-2 text-sand-muted hover:text-sand"
                    >
                      Unassign
                    </button>
                  )}
                </div>
              </form>
            </details>
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
