import { formatTimeRange, to12Hour, type InfoBlock } from "@/lib/itinerary-schema";

export function InfoBlockCard({ block }: { block: InfoBlock }) {
  const time = formatTimeRange(to12Hour(block.timeStart), to12Hour(block.timeEnd));
  return (
    <div className="rounded border border-border bg-surface p-4">
      {time && <div className="text-2xl font-bold text-sand">{time}</div>}
      <div className="mt-1 font-bold text-sand">{block.title}</div>
      {block.content && <p className="mt-2 text-sm text-sand-muted">{block.content}</p>}
    </div>
  );
}
