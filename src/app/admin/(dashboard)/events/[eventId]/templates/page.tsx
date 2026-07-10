import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { ItinerarySchema } from "@/lib/itinerary-schema";
import { TemplateEditorClient } from "./template-editor-client";
import { seedTemplate } from "./actions";

const ROLES = ["lead", "band", "musician", "crew"] as const;
type Role = (typeof ROLES)[number];

const ROLE_LABELS: Record<Role, string> = {
  lead: "Lead artist",
  band: "Band",
  musician: "Musician",
  crew: "Crew",
};

export default async function TemplatesPage({
  params,
  searchParams,
}: {
  params: Promise<{ eventId: string }>;
  searchParams: Promise<{ role?: string }>;
}) {
  const { eventId } = await params;
  const { role: roleParam } = await searchParams;
  const role: Role = ROLES.includes(roleParam as Role) ? (roleParam as Role) : "lead";

  const supabase = await createServerSupabaseClient();
  const { data: template } = await supabase
    .from("templates")
    .select("id, schema")
    .eq("event_id", eventId)
    .eq("role", role)
    .maybeSingle();

  const seedTemplateForRole = seedTemplate.bind(null, eventId, role);

  return (
    <div>
      <div className="mb-6 flex gap-2">
        {ROLES.map((r) => (
          <a
            key={r}
            href={`?role=${r}`}
            className={`rounded px-3 py-1 text-sm ${
              r === role ? "bg-coral text-sand" : "bg-surface text-sand-muted hover:bg-surface-raised"
            }`}
          >
            {ROLE_LABELS[r]}
          </a>
        ))}
      </div>

      {template ? (
        <TemplateEditorClient
          templateId={template.id}
          eventId={eventId}
          initialSchema={template.schema as ItinerarySchema}
        />
      ) : (
        <form action={seedTemplateForRole} className="rounded border border-border bg-surface p-4 text-sm">
          <p className="mb-3 text-sand-muted">
            No template yet for {ROLE_LABELS[role]}. Seed a starting itinerary to edit.
          </p>
          <button type="submit" className="rounded bg-coral px-3 py-2 text-sand hover:bg-coral-bright">
            Seed {ROLE_LABELS[role]} template
          </button>
        </form>
      )}
    </div>
  );
}
