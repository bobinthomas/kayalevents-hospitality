"use client";

import type { TransportBlock, TransportEntry } from "@/lib/itinerary-schema";
import { TransportEntryRow } from "./transport-entry-row";

export function TransportBlockEditor({
  block,
  onChange,
}: {
  block: TransportBlock;
  onChange: (patch: Partial<TransportBlock>) => void;
}) {
  function updateEntry(index: number, patch: Partial<TransportEntry>) {
    onChange({ entries: block.entries.map((entry, i) => (i === index ? { ...entry, ...patch } : entry)) });
  }

  function addEntry() {
    onChange({ entries: [...block.entries, { vehicle: "Car", purpose: "Airport pickup" }] });
  }

  function removeEntry(index: number) {
    onChange({ entries: block.entries.filter((_, i) => i !== index) });
  }

  return (
    <div className="rounded border border-ocean/30 bg-ocean/10 p-3">
      <input
        value={block.title}
        onChange={(e) => onChange({ title: e.target.value })}
        placeholder="Title"
        className="mb-3 w-full border-0 border-b border-border-soft bg-transparent pb-1 text-sm font-medium text-sand focus:outline-none"
      />

      <div className="flex flex-col gap-3">
        {block.entries.map((entry, index) => (
          <TransportEntryRow
            key={index}
            entry={entry}
            onChange={(patch) => updateEntry(index, patch)}
            onRemove={() => removeEntry(index)}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={addEntry}
        className="mt-3 rounded border border-ocean/40 px-2 py-1 text-xs text-ocean hover:bg-ocean/20"
      >
        + Add another
      </button>

      <div className="mt-3 flex items-start gap-3">
        <label className="w-16 shrink-0 pt-1 text-xs text-sand-muted">Details</label>
        <textarea
          value={block.details}
          onChange={(e) => onChange({ details: e.target.value })}
          rows={2}
          placeholder="Transport details, driver contact, etc."
          className="w-full rounded border border-border bg-marine-black px-2 py-1 text-sm text-sand"
        />
      </div>
    </div>
  );
}
