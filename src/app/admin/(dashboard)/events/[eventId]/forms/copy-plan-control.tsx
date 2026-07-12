"use client";

import { useActionState } from "react";
import { copyFormPlan, type CopyPlanState } from "./actions";

export function CopyPlanControl({
  eventId,
  targetArtistId,
  sources,
  hasExistingForm,
}: {
  eventId: string;
  targetArtistId: string;
  sources: { formId: string; artistName: string }[];
  hasExistingForm: boolean;
}) {
  const boundAction = copyFormPlan.bind(null, eventId, targetArtistId);
  const [state, formAction, isPending] = useActionState<CopyPlanState | null, FormData>(
    boundAction,
    null
  );

  if (sources.length === 0) return null;

  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        const select = e.currentTarget.elements.namedItem("source_form_id") as HTMLSelectElement;
        if (!select.value) {
          e.preventDefault();
          return;
        }
        if (
          hasExistingForm &&
          !window.confirm(
            "This will overwrite this artist's current plan (times, logistics, transport) with the copied one. Continue?"
          )
        ) {
          e.preventDefault();
        }
      }}
      className="flex flex-col items-end gap-1"
    >
      <div className="flex items-center gap-1">
        <select
          name="source_form_id"
          defaultValue=""
          className="rounded border border-border bg-marine-black px-2 py-1 text-xs text-sand"
        >
          <option value="" disabled>
            Copy plan from…
          </option>
          {sources.map((s) => (
            <option key={s.formId} value={s.formId}>
              {s.artistName}
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={isPending}
          className="rounded border border-border px-2 py-1 text-xs text-sand-muted hover:bg-surface-raised disabled:opacity-50"
        >
          {isPending ? "Copying…" : "Copy"}
        </button>
      </div>
      {state?.error && <p className="max-w-xs text-right text-xs text-coral-bright">{state.error}</p>}
    </form>
  );
}
