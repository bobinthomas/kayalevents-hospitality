import { to12Hour, type TransportBlock } from "@/lib/itinerary-schema";

export function TransportBlockCard({ block }: { block: TransportBlock }) {
  return (
    <div className="rounded border border-border bg-surface p-4">
      {block.time && <div className="text-2xl font-bold text-sand">{to12Hour(block.time)}</div>}
      <div className="mt-1 font-bold text-sand">{block.title}</div>
      {block.entries.length > 0 && (
        <ul className="mt-2 list-inside list-disc text-sm text-sand-muted">
          {block.entries.map((entry, i) => (
            <li key={i}>
              {entry.vehicle} — {entry.purpose}
            </li>
          ))}
        </ul>
      )}
      {block.details && <p className="mt-2 text-sm text-sand-muted">{block.details}</p>}
    </div>
  );
}
