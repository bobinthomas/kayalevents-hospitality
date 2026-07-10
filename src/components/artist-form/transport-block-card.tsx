import type { TransportBlock } from "@/lib/itinerary-schema";

export function TransportBlockCard({ block }: { block: TransportBlock }) {
  return (
    <div className="rounded border border-border bg-surface p-4">
      <div className="flex items-baseline gap-2">
        {block.time && <span className="text-sm text-sand-muted">{block.time}</span>}
        <span className="font-medium">{block.title}</span>
      </div>
      {block.entries.length > 0 && (
        <ul className="mt-1 list-inside list-disc text-sm text-sand-muted">
          {block.entries.map((entry, i) => (
            <li key={i}>
              {entry.vehicle} — {entry.purpose}
            </li>
          ))}
        </ul>
      )}
      {block.details && <p className="mt-1 text-sm text-sand-muted">{block.details}</p>}
    </div>
  );
}
