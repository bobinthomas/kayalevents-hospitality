import type { FieldBlock } from "@/lib/itinerary-schema";

function formatValue(value: string | string[] | undefined): string {
  if (value === undefined || value === null || value === "") return "—";
  return Array.isArray(value) ? value.join(", ") : value;
}

/** Read-only rendering of a submitted field-block response (admin responses view) — no interactivity, so safe to render from a Server Component. */
export function FieldResponseCard({
  block,
  value,
}: {
  block: FieldBlock;
  value: string | string[] | undefined;
}) {
  return (
    <div className="rounded border border-border bg-surface p-4">
      <div className="mb-1 font-medium">{block.title}</div>
      <p className="text-sm text-sand-muted">{formatValue(value)}</p>
    </div>
  );
}
