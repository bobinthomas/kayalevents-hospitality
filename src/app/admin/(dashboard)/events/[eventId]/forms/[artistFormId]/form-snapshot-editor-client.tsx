"use client";

import { useState, useTransition } from "react";
import { ItineraryEditor } from "@/components/block-editor/itinerary-editor";
import { TokenLinkActions } from "@/components/admin/token-link-actions";
import type { ItinerarySchema } from "@/lib/itinerary-schema";
import { saveFormSnapshot, setFormDeadline } from "../actions";

function toDatetimeLocal(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toISOString().slice(0, 16);
}

export function FormSnapshotEditorClient({
  formId,
  eventId,
  token,
  initialSchema,
  initialDeadline,
}: {
  formId: string;
  eventId: string;
  token: string;
  initialSchema: ItinerarySchema;
  initialDeadline: string | null;
}) {
  const [schema, setSchema] = useState(initialSchema);
  const [deadline, setDeadline] = useState(toDatetimeLocal(initialDeadline));
  const [isPending, startTransition] = useTransition();
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  function handleSaveSnapshot() {
    setSavedMessage(null);
    startTransition(async () => {
      await saveFormSnapshot(formId, eventId, schema);
      setSavedMessage("Snapshot saved.");
    });
  }

  function handleSaveDeadline() {
    setSavedMessage(null);
    startTransition(async () => {
      const iso = deadline ? new Date(deadline).toISOString() : "";
      await setFormDeadline(formId, eventId, iso);
      setSavedMessage("Deadline saved — form marked as sent.");
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <TokenLinkActions token={token} />

      <div className="rounded border border-border bg-surface p-4">
        <label className="flex flex-col gap-1 text-sm text-sand-muted">
          Deadline
          <div className="flex gap-3">
            <input
              type="datetime-local"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="rounded border border-border bg-marine-black px-3 py-2 text-sand"
            />
            <button
              onClick={handleSaveDeadline}
              disabled={isPending}
              className="rounded bg-coral px-3 py-2 text-sm text-sand hover:bg-coral-bright disabled:opacity-50"
            >
              Save deadline
            </button>
          </div>
        </label>
      </div>

      <ItineraryEditor schema={schema} onChange={setSchema} mode="snapshot" />

      <div className="flex items-center gap-3">
        <button
          onClick={handleSaveSnapshot}
          disabled={isPending}
          className="rounded bg-coral px-3 py-2 text-sm text-sand hover:bg-coral-bright disabled:opacity-50"
        >
          {isPending ? "Saving…" : "Save changes"}
        </button>
        {savedMessage && <span className="text-sm text-lagoon-bright">{savedMessage}</span>}
      </div>
    </div>
  );
}
