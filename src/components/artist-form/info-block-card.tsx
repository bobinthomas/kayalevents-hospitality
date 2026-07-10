import type { InfoBlock } from "@/lib/itinerary-schema";

export function InfoBlockCard({ block }: { block: InfoBlock }) {
  return (
    <div className="rounded border border-border bg-surface p-4">
      <div className="flex items-baseline gap-2">
        {block.time && <span className="text-sm text-sand-muted">{block.time}</span>}
        <span className="font-medium">{block.title}</span>
      </div>
      <p className="mt-1 text-sm text-sand-muted">{block.content}</p>
    </div>
  );
}
