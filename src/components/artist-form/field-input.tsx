"use client";

import type { FieldBlock } from "@/lib/itinerary-schema";

export function FieldInput({
  block,
  value,
  onChange,
  disabled,
}: {
  block: FieldBlock;
  value: string | string[] | undefined;
  onChange: (value: string | string[]) => void;
  disabled: boolean;
}) {
  const options = block.field.options ?? [];

  return (
    <div className="rounded border border-border bg-surface p-4">
      <div className="mb-2 font-medium">
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
    </div>
  );
}
