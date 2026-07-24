"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { ItinerarySchema } from "@/lib/itinerary-schema";
import { resetFormsToTemplate, type ResetMode } from "./actions";

/**
 * Resets one (or many, for the bulk case) artist forms back onto their
 * role's current template. Used both per-row on the forms list and as a
 * bulk action there, and standalone on a single form's detail page — `onReset`
 * lets the detail page sync its local editor state without a full reload.
 */
export function ResetToTemplateControl({
  eventId,
  formIds,
  label = "Reset to template",
  onReset,
}: {
  eventId: string;
  formIds: string[];
  label?: string;
  onReset?: (schemas: Record<string, ItinerarySchema>) => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  if (formIds.length === 0) return null;

  function run(mode: ResetMode) {
    setOpen(false);
    setMessage(null);
    startTransition(async () => {
      const result = await resetFormsToTemplate(eventId, formIds, mode);
      if (result.error) {
        setMessage(result.error);
        return;
      }
      const updated = result.updated ?? 0;
      setMessage(
        updated === 0
          ? "No template seeded for these roles yet — nothing reset."
          : `${updated} form${updated === 1 ? "" : "s"} reset (${mode === "structure" ? "structure synced" : "full reset"}).`
      );
      if (onReset && result.schemas) onReset(result.schemas);
      router.refresh();
    });
  }

  return (
    <div className="relative inline-flex items-center gap-2 text-sm">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={isPending}
        className="text-ocean hover:underline disabled:opacity-50"
      >
        {isPending ? "Resetting…" : label}
      </button>
      {open && (
        <div className="absolute right-0 top-full z-10 mt-1 flex w-64 flex-col gap-1 rounded border border-border bg-surface p-2 shadow-lg">
          <p className="px-1 text-xs text-sand-muted">
            Rebuild {formIds.length === 1 ? "this form" : `${formIds.length} forms`} from the current template.
          </p>
          <button
            type="button"
            onClick={() => run("structure")}
            className="rounded px-2 py-1.5 text-left hover:bg-surface-raised"
          >
            <span className="block text-xs font-medium text-sand">Sync structure</span>
            <span className="block text-xs text-sand-muted">
              Match the template&rsquo;s days/questions, keep matching answers.
            </span>
          </button>
          <button
            type="button"
            onClick={() => run("full")}
            className="rounded px-2 py-1.5 text-left hover:bg-surface-raised"
          >
            <span className="block text-xs font-medium text-coral-bright">Full reset</span>
            <span className="block text-xs text-sand-muted">
              Discard all answers, start from a fresh copy of the template.
            </span>
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded px-2 py-1 text-left text-xs text-sand-muted hover:bg-surface-raised"
          >
            Cancel
          </button>
        </div>
      )}
      {message && <span className="text-xs text-lagoon-bright">{message}</span>}
    </div>
  );
}
