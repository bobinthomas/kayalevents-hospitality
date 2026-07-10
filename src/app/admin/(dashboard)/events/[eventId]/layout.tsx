import Link from "next/link";
import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { EventTabs } from "@/components/admin/event-tabs";

export default async function EventLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: event } = await supabase
    .from("events")
    .select("id, name")
    .eq("id", eventId)
    .single();

  if (!event) notFound();

  const [{ count: rosterCount }, { count: templatesCount }, { count: formsCount }, { count: responsesCount }] =
    await Promise.all([
      supabase.from("artists").select("id", { count: "exact", head: true }).eq("event_id", eventId),
      supabase.from("templates").select("id", { count: "exact", head: true }).eq("event_id", eventId),
      supabase.from("artist_forms").select("id", { count: "exact", head: true }).eq("event_id", eventId),
      supabase
        .from("artist_forms")
        .select("id", { count: "exact", head: true })
        .eq("event_id", eventId)
        .eq("status", "submitted"),
    ]);

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-2 text-sm text-sand-muted">
        <Link href="/admin" className="hover:text-sand hover:underline">
          Events
        </Link>{" "}
        / {event.name}
      </div>
      <h1 className="font-display mb-6 text-xl">{event.name}</h1>
      <EventTabs
        eventId={eventId}
        counts={{
          roster: rosterCount ?? 0,
          templates: templatesCount ?? 0,
          forms: formsCount ?? 0,
          responses: responsesCount ?? 0,
        }}
      />
      {children}
    </div>
  );
}
