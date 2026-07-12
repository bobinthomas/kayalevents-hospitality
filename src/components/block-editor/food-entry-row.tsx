"use client";

import { useState } from "react";
import type { FieldBlock } from "@/lib/itinerary-schema";
import { MEAL_MOMENTS, OPTION_SETS, type MealMoment } from "@/lib/day-type-presets";

function optionSetKeyFor(options: string[]): string {
  const match = Object.entries(OPTION_SETS).find(
    ([key, set]) => key !== "custom" && JSON.stringify(set.options) === JSON.stringify(options)
  );
  return match ? match[0] : "custom";
}

function momentFor(title: string): MealMoment {
  return (MEAL_MOMENTS as readonly string[]).includes(title) ? (title as MealMoment) : "Custom";
}

export function FoodEntryRow({
  block,
  onChange,
  onRemove,
}: {
  block: FieldBlock;
  onChange: (patch: Partial<FieldBlock>) => void;
  onRemove: () => void;
}) {
  const [customMoment, setCustomMoment] = useState(momentFor(block.title) === "Custom");
  const [optionSetKey, setOptionSetKey] = useState(optionSetKeyFor(block.field.options ?? []));

  function handleMomentChange(value: string) {
    if (value === "Custom") {
      setCustomMoment(true);
      return;
    }
    setCustomMoment(false);
    onChange({ title: value, time: value });
  }

  function handleOptionSetChange(key: string) {
    setOptionSetKey(key);
    if (key !== "custom") {
      onChange({ field: { ...block.field, type: "single_select", options: OPTION_SETS[key].options } });
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-sand-muted">Type</label>
          {customMoment ? (
            <input
              value={block.title}
              onChange={(e) => onChange({ title: e.target.value, time: null })}
              placeholder="Custom moment"
              className="rounded border border-border bg-marine-black px-2 py-1 text-sm text-sand"
            />
          ) : (
            <select
              value={momentFor(block.title)}
              onChange={(e) => handleMomentChange(e.target.value)}
              className="rounded border border-border bg-marine-black px-2 py-1 text-sm text-sand"
            >
              {MEAL_MOMENTS.map((moment) => (
                <option key={moment} value={moment}>
                  {moment}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-sand-muted">Select</label>
          <select
            value={optionSetKey}
            onChange={(e) => handleOptionSetChange(e.target.value)}
            className="rounded border border-border bg-marine-black px-2 py-1 text-sm text-sand"
          >
            {Object.entries(OPTION_SETS).map(([key, set]) => (
              <option key={key} value={key}>
                {set.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-sand-muted">From</label>
          <input
            type="time"
            value={block.servedAtStart ?? ""}
            onChange={(e) => onChange({ servedAtStart: e.target.value || null })}
            className="rounded border border-border bg-marine-black px-2 py-1 text-sm text-sand"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-sand-muted">To</label>
          <input
            type="time"
            value={block.servedAtEnd ?? ""}
            onChange={(e) => onChange({ servedAtEnd: e.target.value || null })}
            className="rounded border border-border bg-marine-black px-2 py-1 text-sm text-sand"
          />
        </div>

        <button type="button" onClick={onRemove} className="text-xs text-coral-bright hover:underline">
          Remove
        </button>
      </div>

      {optionSetKey === "custom" && (
        <textarea
          value={(block.field.options ?? []).join("\n")}
          onChange={(e) =>
            onChange({
              field: {
                ...block.field,
                type: "single_select",
                options: e.target.value.split("\n").map((o) => o.trim()).filter(Boolean),
              },
            })
          }
          rows={2}
          placeholder="One option per line"
          className="w-full rounded border border-border bg-marine-black px-2 py-1 text-sm text-sand"
        />
      )}

      <textarea
        value={block.description ?? ""}
        onChange={(e) => onChange({ description: e.target.value })}
        rows={1}
        placeholder="Optional note shown to the artist above the choices"
        className="w-full rounded border border-border bg-marine-black px-2 py-1 text-sm text-sand"
      />
    </div>
  );
}
