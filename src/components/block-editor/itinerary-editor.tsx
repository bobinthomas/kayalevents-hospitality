"use client";

import { useState } from "react";
import type { Block, FieldBlock, InfoBlock, ItinerarySchema, TransportBlock } from "@/lib/itinerary-schema";
import { DAY_TYPES, OPTION_SETS, presetBlocksForDayType, sortedSections, type DayType } from "@/lib/day-type-presets";
import { InfoBlockEditor } from "./info-block-editor";
import { TransportBlockEditor } from "./transport-block-editor";
import { FoodEntryRow } from "./food-entry-row";

function blankInfoBlock(): InfoBlock {
  return { id: crypto.randomUUID(), kind: "info", timeStart: null, timeEnd: null, title: "", content: "" };
}

function blankFoodBlock(): FieldBlock {
  return {
    id: crypto.randomUUID(),
    kind: "field",
    time: "Breakfast",
    servedAtStart: null,
    servedAtEnd: null,
    title: "Breakfast",
    field: { type: "single_select", required: true, options: OPTION_SETS.cuisine.options },
  };
}

function blankTransportBlock(): TransportBlock {
  return {
    id: crypto.randomUUID(),
    kind: "transport",
    time: null,
    title: "Transport arrangement",
    entries: [{ vehicle: "Car", purpose: "Airport pickup" }],
    details: "",
  };
}

function blankDetailsField(): FieldBlock {
  return {
    id: crypto.randomUUID(),
    kind: "field",
    time: null,
    servedAtStart: null,
    servedAtEnd: null,
    description: "",
    title: "",
    field: { type: "text", required: false },
  };
}

/**
 * Shared by the template editor (P0-4) and the per-artist snapshot editor
 * (P0-5) — both mutate the identical { sections[].blocks[] } JSONB shape.
 * Days are navigated via a left sidebar; each day's blocks are grouped into
 * a plain logistics list, a Transport Arrangement group, and a Food &
 * refreshments group, inferred from block kind/field type — no extra schema
 * needed to support the grouping.
 */
export function ItineraryEditor({
  schema,
  onChange,
  mode,
}: {
  schema: ItinerarySchema;
  onChange: (next: ItinerarySchema) => void;
  mode: "template" | "snapshot";
}) {
  // Always derive display order at render time (Arrival → Rehearsal → Event
  // → Departure, date as tiebreaker) rather than relying on stored array
  // order — this fixes display for data saved before this ordering existed,
  // and keeps every consumer (editor, artist page, responses, PDF) consistent
  // without each one having to remember to sort after every edit.
  const orderedSections = sortedSections(schema.sections);

  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(
    orderedSections[0]?.id ?? null
  );
  const [showAddDay, setShowAddDay] = useState(false);
  const [newDayDate, setNewDayDate] = useState("");
  const [newDayType, setNewDayType] = useState<DayType>("Arrival");
  const [newDayLabel, setNewDayLabel] = useState("Arrival");

  const effectiveSelectedId = orderedSections.some((s) => s.id === selectedSectionId)
    ? selectedSectionId
    : (orderedSections[0]?.id ?? null);
  const selectedSection = orderedSections.find((s) => s.id === effectiveSelectedId) ?? null;

  function updateBlock(sectionId: string, blockId: string, patch: Partial<Block>) {
    onChange({
      sections: schema.sections.map((section) =>
        section.id !== sectionId
          ? section
          : {
              ...section,
              blocks: section.blocks.map((block) =>
                block.id !== blockId ? block : ({ ...block, ...patch } as Block)
              ),
            }
      ),
    });
  }

  function updateSection(sectionId: string, patch: Partial<Pick<ItinerarySchema["sections"][number], "date" | "label">>) {
    onChange({
      sections: schema.sections.map((section) => (section.id !== sectionId ? section : { ...section, ...patch })),
    });
  }

  function removeSection(sectionId: string) {
    onChange({ sections: schema.sections.filter((section) => section.id !== sectionId) });
  }

  function addBlockToSection(sectionId: string, block: Block) {
    onChange({
      sections: schema.sections.map((section) =>
        section.id !== sectionId ? section : { ...section, blocks: [...section.blocks, block] }
      ),
    });
  }

  function removeBlock(sectionId: string, blockId: string) {
    onChange({
      sections: schema.sections.map((section) =>
        section.id !== sectionId
          ? section
          : { ...section, blocks: section.blocks.filter((block) => block.id !== blockId) }
      ),
    });
  }

  function addDay() {
    if (!newDayDate) return;
    const id = crypto.randomUUID();
    onChange({
      sections: [
        ...schema.sections,
        { id, date: newDayDate, label: newDayLabel || newDayType, blocks: presetBlocksForDayType(newDayType) },
      ],
    });
    setSelectedSectionId(id);
    setNewDayDate("");
    setShowAddDay(false);
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs text-sand-muted">
        {mode === "template"
          ? "Editing template — affects future artists assigned this role."
          : "Editing this artist's form only — the template is untouched."}
      </p>

      <div className="flex gap-6">
        <div className="flex w-48 shrink-0 flex-col gap-1">
          {orderedSections.map((section) => (
            <button
              key={section.id}
              type="button"
              onClick={() => setSelectedSectionId(section.id)}
              className={`rounded px-3 py-2 text-left text-sm ${
                section.id === effectiveSelectedId
                  ? "bg-coral text-sand"
                  : "bg-surface text-sand-muted hover:bg-surface-raised"
              }`}
            >
              {section.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setShowAddDay((v) => !v)}
            className="rounded border border-dashed border-border-soft px-3 py-2 text-left text-sm text-sand-muted hover:bg-surface-raised"
          >
            + Add New
          </button>

          {showAddDay && (
            <div className="flex flex-col gap-2 rounded border border-border bg-surface p-3">
              <label className="flex flex-col gap-1 text-xs text-sand-muted">
                Date
                <input
                  type="date"
                  value={newDayDate}
                  onChange={(e) => setNewDayDate(e.target.value)}
                  className="rounded border border-border bg-marine-black px-2 py-1 text-sm text-sand"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs text-sand-muted">
                Day type
                <select
                  value={newDayType}
                  onChange={(e) => {
                    const type = e.target.value as DayType;
                    setNewDayType(type);
                    setNewDayLabel(type);
                  }}
                  className="rounded border border-border bg-marine-black px-2 py-1 text-sm text-sand"
                >
                  {DAY_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-xs text-sand-muted">
                Day name
                <input
                  value={newDayLabel}
                  onChange={(e) => setNewDayLabel(e.target.value)}
                  className="rounded border border-border bg-marine-black px-2 py-1 text-sm text-sand"
                />
              </label>
              <button
                type="button"
                onClick={addDay}
                disabled={!newDayDate}
                className="rounded bg-coral px-3 py-1.5 text-sm text-sand hover:bg-coral-bright disabled:opacity-50"
              >
                Create day
              </button>
            </div>
          )}
        </div>

        <div className="flex-1">
          {!selectedSection ? (
            <p className="text-sm text-sand-muted">No days yet — click &ldquo;+ Add New&rdquo; to get started.</p>
          ) : (
            (() => {
              const section = selectedSection;
              const infoBlocks = section.blocks.filter((b): b is InfoBlock => b.kind === "info");
              const transportBlock = section.blocks.find((b): b is TransportBlock => b.kind === "transport");
              const foodBlocks = section.blocks.filter(
                (b): b is FieldBlock => b.kind === "field" && b.field.type !== "text"
              );
              const detailsFields = section.blocks.filter(
                (b): b is FieldBlock => b.kind === "field" && b.field.type === "text"
              );

              return (
                <div className="flex flex-col gap-6">
                  <div className="flex items-center gap-3">
                    <input
                      type="date"
                      value={section.date}
                      onChange={(e) => updateSection(section.id, { date: e.target.value })}
                      className="rounded border border-border bg-surface px-2 py-1 text-sm text-sand"
                    />
                    <input
                      value={section.label}
                      onChange={(e) => updateSection(section.id, { label: e.target.value })}
                      placeholder="Day name"
                      className="flex-1 rounded border border-border bg-surface px-2 py-1 font-medium text-sand"
                    />
                    <button
                      type="button"
                      onClick={() => removeSection(section.id)}
                      className="text-xs text-coral-bright hover:underline"
                    >
                      Remove day
                    </button>
                  </div>

                  <div className="flex flex-col gap-3">
                    {infoBlocks.map((block) => (
                      <div key={block.id} className="flex items-start gap-2">
                        <div className="flex-1">
                          <InfoBlockEditor
                            block={block}
                            onChange={(patch) => updateBlock(section.id, block.id, patch)}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeBlock(section.id, block.id)}
                          className="mt-3 text-xs text-coral-bright hover:underline"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addBlockToSection(section.id, blankInfoBlock())}
                      className="self-start rounded border border-border px-2 py-1 text-xs text-sand-muted hover:bg-surface-raised"
                    >
                      + Add logistics note
                    </button>
                  </div>

                  <div>
                    <h3 className="mb-2 text-sm font-medium text-sand-muted">Transport Arrangement</h3>
                    {transportBlock ? (
                      <TransportBlockEditor
                        block={transportBlock}
                        onChange={(patch) => {
                          const merged = { ...transportBlock, ...patch };
                          if (merged.entries.length === 0) {
                            removeBlock(section.id, transportBlock.id);
                          } else {
                            updateBlock(section.id, transportBlock.id, patch);
                          }
                        }}
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={() => addBlockToSection(section.id, blankTransportBlock())}
                        className="rounded border border-border px-2 py-1 text-xs text-sand-muted hover:bg-surface-raised"
                      >
                        + Add transport arrangement
                      </button>
                    )}
                  </div>

                  <div>
                    <h3 className="mb-2 text-sm font-medium text-sand-muted">Food &amp; refreshments</h3>
                    <div className="flex flex-col gap-4 rounded border border-border bg-surface p-3">
                      {foodBlocks.map((block) => (
                        <FoodEntryRow
                          key={block.id}
                          block={block}
                          onChange={(patch) => updateBlock(section.id, block.id, patch)}
                          onRemove={() => removeBlock(section.id, block.id)}
                        />
                      ))}
                      <button
                        type="button"
                        onClick={() => addBlockToSection(section.id, blankFoodBlock())}
                        className="self-start rounded border border-ocean/40 px-2 py-1 text-xs text-ocean hover:bg-ocean/20"
                      >
                        + Add another
                      </button>
                    </div>
                  </div>

                  <div>
                    <h3 className="mb-2 text-sm font-medium text-sand-muted">Additional questions</h3>
                    <div className="flex flex-col gap-3 rounded border border-border bg-surface p-3">
                      {detailsFields.map((field) => (
                        <div key={field.id} className="flex flex-col gap-2 border-b border-border-soft pb-3 last:border-b-0 last:pb-0">
                          <div className="flex items-start gap-2">
                            <input
                              value={field.title}
                              onChange={(e) => updateBlock(section.id, field.id, { title: e.target.value })}
                              placeholder="Question (e.g. Allergies / dietary requirements)"
                              className="flex-1 rounded border border-border bg-marine-black px-2 py-1 text-sm font-medium text-sand"
                            />
                            <button
                              type="button"
                              onClick={() => removeBlock(section.id, field.id)}
                              className="mt-1 text-xs text-coral-bright hover:underline"
                            >
                              Remove
                            </button>
                          </div>
                          <div className="flex flex-wrap items-center gap-3">
                            <label className="text-xs text-sand-muted">From</label>
                            <input
                              type="time"
                              value={field.servedAtStart ?? ""}
                              onChange={(e) => updateBlock(section.id, field.id, { servedAtStart: e.target.value || null })}
                              className="rounded border border-border bg-marine-black px-2 py-1 text-sm text-sand"
                            />
                            <label className="text-xs text-sand-muted">To</label>
                            <input
                              type="time"
                              value={field.servedAtEnd ?? ""}
                              onChange={(e) => updateBlock(section.id, field.id, { servedAtEnd: e.target.value || null })}
                              className="rounded border border-border bg-marine-black px-2 py-1 text-sm text-sand"
                            />
                            <label className="flex items-center gap-1.5 text-xs text-sand-muted">
                              <input
                                type="checkbox"
                                checked={field.hiddenFromArtist ?? false}
                                onChange={(e) => updateBlock(section.id, field.id, { hiddenFromArtist: e.target.checked })}
                              />
                              Hide from artist form
                            </label>
                          </div>
                          <textarea
                            value={field.description ?? ""}
                            onChange={(e) => updateBlock(section.id, field.id, { description: e.target.value })}
                            rows={1}
                            placeholder="Optional footnote shown below the answer box"
                            className="w-full rounded border border-border bg-marine-black px-2 py-1 text-sm text-sand"
                          />
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => addBlockToSection(section.id, blankDetailsField())}
                        className="self-start rounded border border-border px-2 py-1 text-xs text-sand-muted hover:bg-surface-raised"
                      >
                        + Add question
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()
          )}
        </div>
      </div>
    </div>
  );
}
