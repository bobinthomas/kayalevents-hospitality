"use client";

import { useState } from "react";
import type { TransportEntry } from "@/lib/itinerary-schema";
import { VEHICLE_TYPES, PURPOSE_OPTIONS } from "@/lib/day-type-presets";

export function TransportEntryRow({
  entry,
  onChange,
  onRemove,
}: {
  entry: TransportEntry;
  onChange: (patch: Partial<TransportEntry>) => void;
  onRemove: () => void;
}) {
  const [customVehicle, setCustomVehicle] = useState(!VEHICLE_TYPES.includes(entry.vehicle));
  const [customPurpose, setCustomPurpose] = useState(!PURPOSE_OPTIONS.includes(entry.purpose));

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex flex-col gap-1">
        <label className="text-xs text-sand-muted">Vehicle</label>
        {customVehicle ? (
          <input
            value={entry.vehicle}
            onChange={(e) => onChange({ vehicle: e.target.value })}
            placeholder="Vehicle type"
            className="rounded border border-border bg-marine-black px-2 py-1 text-sm text-sand"
          />
        ) : (
          <select
            value={entry.vehicle}
            onChange={(e) => {
              if (e.target.value === "Other") {
                setCustomVehicle(true);
                onChange({ vehicle: "" });
              } else {
                onChange({ vehicle: e.target.value });
              }
            }}
            className="rounded border border-border bg-marine-black px-2 py-1 text-sm text-sand"
          >
            {VEHICLE_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs text-sand-muted">Purpose</label>
        {customPurpose ? (
          <input
            value={entry.purpose}
            onChange={(e) => onChange({ purpose: e.target.value })}
            placeholder="Purpose"
            className="rounded border border-border bg-marine-black px-2 py-1 text-sm text-sand"
          />
        ) : (
          <select
            value={entry.purpose}
            onChange={(e) => {
              if (e.target.value === "Other") {
                setCustomPurpose(true);
                onChange({ purpose: "" });
              } else {
                onChange({ purpose: e.target.value });
              }
            }}
            className="rounded border border-border bg-marine-black px-2 py-1 text-sm text-sand"
          >
            {PURPOSE_OPTIONS.map((purpose) => (
              <option key={purpose} value={purpose}>
                {purpose}
              </option>
            ))}
          </select>
        )}
      </div>

      <button
        type="button"
        onClick={onRemove}
        className="self-end text-xs text-coral-bright hover:underline"
      >
        Remove
      </button>
    </div>
  );
}
