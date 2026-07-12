"use client";

import { formatTimeRange, isChoiceField, to12Hour, type FieldBlock } from "@/lib/itinerary-schema";

export function FieldInput({
  block,
  value,
  onChange,
  disabled,
  notesValue,
  onNotesChange,
}: {
  block: FieldBlock;
  value: string | string[] | undefined;
  onChange: (value: string | string[]) => void;
  disabled: boolean;
  notesValue?: string;
  onNotesChange?: (value: string) => void;
}) {
  const options = block.field.options ?? [];
  const servedAt = formatTimeRange(to12Hour(block.servedAtStart), to12Hour(block.servedAtEnd));

  return (
    <div className="rounded border border-border bg-surface p-4">
      {servedAt && <div className="text-2xl font-bold text-sand">{servedAt}</div>}
      <div className="mb-2 mt-1 font-bold text-sand">
        {block.title}
        {block.field.required && <span className="ml-1 text-coral-bright">*</span>}
      </div>

      {block.field.type === "single_select" && (
        <div className="flex flex-col gap-2">
          {options.map((option) => (
            <label key={option} className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name={block.id}
                checked={value === option}
                onChange={() => onChange(option)}
                disabled={disabled}
              />
              {option}
            </label>
          ))}
        </div>
      )}

      {block.field.type === "multi_select" && (
        <div className="flex flex-col gap-2">
          {options.map((option) => {
            const selected = Array.isArray(value) ? value : [];
            return (
              <label key={option} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={selected.includes(option)}
                  onChange={(e) =>
                    onChange(
                      e.target.checked
                        ? [...selected, option]
                        : selected.filter((o) => o !== option)
                    )
                  }
                  disabled={disabled}
                />
                {option}
              </label>
            );
          })}
        </div>
      )}

      {block.field.type === "text" && (
        <textarea
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          rows={2}
          className="w-full rounded border border-border bg-marine-black px-3 py-2 text-sm text-sand disabled:opacity-60"
        />
      )}

      {isChoiceField(block) && onNotesChange && (
        <div className="mt-3 border-t border-border-soft pt-3">
          <div className="eyebrow mb-1">Special requirements</div>
          <textarea
            value={notesValue ?? ""}
            onChange={(e) => onNotesChange(e.target.value)}
            disabled={disabled}
            rows={2}
            placeholder="Anything specific about your menu or choice…"
            className="w-full rounded border border-border bg-marine-black px-3 py-2 text-sm text-sand disabled:opacity-60"
          />
        </div>
      )}

      {block.description && (
        <p className="mt-3 border-t border-border-soft pt-3 text-xs italic text-sand-muted">
          {block.description}
        </p>
      )}
    </div>
  );
}
