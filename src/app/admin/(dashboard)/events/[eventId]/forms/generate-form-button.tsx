"use client";

import { useActionState } from "react";
import { generateFormForArtist, type GenerateFormState } from "./actions";

export function GenerateFormButton({ eventId, artistId }: { eventId: string; artistId: string }) {
  const boundAction = generateFormForArtist.bind(null, eventId);
  const [state, formAction, isPending] = useActionState<GenerateFormState | null, FormData>(
    boundAction,
    null
  );

  return (
    <form action={formAction} className="flex flex-col items-end gap-1">
      <input type="hidden" name="artist_id" value={artistId} />
      <button
        type="submit"
        disabled={isPending}
        className="rounded bg-coral px-3 py-1.5 text-sm text-sand hover:bg-coral-bright disabled:opacity-50"
      >
        {isPending ? "Generating…" : "Generate form"}
      </button>
      {state?.error && <p className="max-w-xs text-right text-xs text-coral-bright">{state.error}</p>}
    </form>
  );
}
