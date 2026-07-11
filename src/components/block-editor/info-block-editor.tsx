"use client";

import type { InfoBlock } from "@/lib/itinerary-schema";

export function InfoBlockEditor({
  block,
  onChange,
}: {
  block: InfoBlock;
  onChange: (patch: Partial<InfoBlock>) => void;
}) {
  return (
    <div className="rounded bg-surface-raised p-3">
      <input
        value={block.title}
        onChange={(e) => onChange({ title: e.target.value })}
        placeholder="Title (e.g. Flight arrival)"
        className="mb-3 w-full border-0 border-b border-border-soft bg-transparent pb-1 text-sm font-medium text-sand focus:outline-none"
      />
      <div className="mb-2 flex items-center gap-3">
        <label className="w-16 shrink-0 text-xs text-sand-muted">From</label>
        <input
          type="time"
          value={block.timeStart ?? ""}
          onChange={(e) => onChange({ timeStart: e.target.value || null })}
          className="rounded border border-border bg-marine-black px-2 py-1 text-sm text-sand"
        />
        <label className="shrink-0 text-xs text-sand-muted">To</label>
        <input
          type="time"
          value={block.timeEnd ?? ""}
          onChange={(e) => onChange({ timeEnd: e.target.value || null })}
          className="rounded border border-border bg-marine-black px-2 py-1 text-sm text-sand"
        />
      </div>
      <div className="flex items-start gap-3">
        <label className="w-16 shrink-0 pt-1 text-xs text-sand-muted">Details</label>
        <textarea
          value={block.content}
          onChange={(e) => onChange({ content: e.target.value })}
          rows={2}
          placeholder="Notes"
          className="w-full rounded border border-border bg-marine-black px-2 py-1 text-sm text-sand"
        />
      </div>
    </div>
  );
}
