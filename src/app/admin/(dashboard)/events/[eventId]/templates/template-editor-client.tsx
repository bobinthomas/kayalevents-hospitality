"use client";

import { useState, useTransition } from "react";
import { ItineraryEditor } from "@/components/block-editor/itinerary-editor";
import type { ItinerarySchema } from "@/lib/itinerary-schema";
import { saveTemplate } from "./actions";

export function TemplateEditorClient({
  templateId,
  eventId,
  initialSchema,
}: {
  templateId: string;
  eventId: string;
  initialSchema: ItinerarySchema;
}) {
  const [schema, setSchema] = useState(initialSchema);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function handleSave() {
    setSaved(false);
    startTransition(async () => {
      await saveTemplate(templateId, eventId, schema);
      setSaved(true);
    });
  }

  return (
    <div>
      <ItineraryEditor schema={schema} onChange={setSchema} mode="template" />
      <div className="mt-4 flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={isPending}
          className="rounded bg-coral px-3 py-2 text-sm text-sand hover:bg-coral-bright disabled:opacity-50"
        >
          {isPending ? "Saving…" : "Save template"}
        </button>
        {saved && <span className="text-sm text-lagoon-bright">Saved.</span>}
      </div>
    </div>
  );
}
