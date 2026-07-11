import { to12Hour, type InfoBlock } from "@/lib/itinerary-schema";

export function InfoBlockCard({ block }: { block: InfoBlock }) {
  return (
    <div className="rounded border border-border bg-surface p-4">
      {block.time && <div className="text-2xl font-bold text-sand">{to12Hour(block.time)}</div>}
      <div className="mt-1 font-bold text-sand">{block.title}</div>
      {block.content && <p className="mt-2 text-sm text-sand-muted">{block.content}</p>}
    </div>
  );
}
