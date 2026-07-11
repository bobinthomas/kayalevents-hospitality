import { formatTimeRange, isChoiceField, type FieldBlock } from "@/lib/itinerary-schema";

function formatValue(value: string | string[] | undefined): string {
  if (value === undefined || value === null || value === "") return "—";
  return Array.isArray(value) ? value.join(", ") : value;
}

/** Read-only rendering of a submitted field-block response (admin responses view) — no interactivity, so safe to render from a Server Component. */
export function FieldResponseCard({
  block,
  value,
  notesValue,
}: {
  block: FieldBlock;
  value: string | string[] | undefined;
  notesValue?: string;
}) {
  const servedAt = formatTimeRange(block.servedAtStart, block.servedAtEnd);

  return (
    <div className="rounded border border-border bg-surface p-4">
      {servedAt && <div className="text-lg font-bold text-sand">{servedAt}</div>}
      <div className="mb-1 font-medium">{block.title}</div>
      <p className="text-sm text-sand-muted">{formatValue(value)}</p>
      {isChoiceField(block) && notesValue && (
        <div className="mt-2 border-t border-border-soft pt-2">
          <div className="eyebrow mb-1">Special requirements</div>
          <p className="text-sm text-sand-muted">{notesValue}</p>
        </div>
      )}
    </div>
  );
}
