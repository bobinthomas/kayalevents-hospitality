"use client";

import { use, useEffect, useState } from "react";
import {
  isSectionComplete,
  missingRequiredFields,
  sectionIndexForBlock,
  specialRequirementsKey,
  type ItinerarySchema,
  type ResponseData,
} from "@/lib/itinerary-schema";
import { sortedSections } from "@/lib/day-type-presets";
import { InfoBlockCard } from "@/components/artist-form/info-block-card";
import { TransportBlockCard } from "@/components/artist-form/transport-block-card";
import { FieldInput } from "@/components/artist-form/field-input";
import { TurnstileWidget } from "@/components/artist-form/turnstile-widget";
import { LockedBanner } from "@/components/artist-form/locked-banner";

interface GetFormResponse {
  artist_name: string;
  event_name: string;
  form_schema: ItinerarySchema;
  response_data: ResponseData;
  status: string;
  deadline: string | null;
  locked: boolean;
}

export default function ArtistFormPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);

  const [state, setState] = useState<
    | { phase: "loading" }
    | { phase: "error"; message: string }
    | { phase: "ready"; data: GetFormResponse }
  >({ phase: "loading" });
  const [responseData, setResponseData] = useState<ResponseData>({});
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    fetch(`/api/public/get-form?token=${encodeURIComponent(token)}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Failed to load form");
        return data as GetFormResponse;
      })
      .then((data) => {
        setState({ phase: "ready", data });
        setResponseData(data.response_data ?? {});
      })
      .catch((err) => setState({ phase: "error", message: err.message }));
  }, [token]);

  if (state.phase === "loading") {
    return <main className="mx-auto max-w-xl px-6 py-12 text-sm text-sand-muted">Loading…</main>;
  }

  if (state.phase === "error") {
    return (
      <main className="mx-auto max-w-xl px-6 py-12 text-sm text-coral-bright">
        {state.message === "not found" ? "This link is invalid or has expired." : state.message}
      </main>
    );
  }

  const { data } = state;
  const disabled = data.locked || submitting;

  const turnstileConfigured = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);

    const missing = missingRequiredFields(data.form_schema, responseData);
    if (missing.length > 0) {
      const orderedSections = sortedSections(data.form_schema.sections);
      const jumpTo = sectionIndexForBlock(orderedSections, missing[0].id);
      if (jumpTo !== -1) setStepIndex(jumpTo);
      setSubmitError(`Please answer required questions: ${missing.map((b) => b.title).join(", ")}`);
      return;
    }

    if (turnstileConfigured && !turnstileToken) {
      setSubmitError("Please complete the security check.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/public/submit-form", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, response_data: responseData, turnstile_token: turnstileToken ?? "" }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Submission failed");
      setSubmitted(true);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <main className="mx-auto max-w-xl px-6 py-12">
        <h1 className="font-display mb-2 text-2xl">Thank you, {data.artist_name}!</h1>
        <p className="text-sm text-sand-muted">
          Your preferences for {data.event_name} have been recorded. You can reopen this link to
          review or update your answers until the deadline.
        </p>
      </main>
    );
  }

  const orderedSections = sortedSections(data.form_schema.sections);
  const currentIndex = Math.min(stepIndex, orderedSections.length - 1);
  const currentSection = orderedSections[currentIndex];
  const isLastStep = currentIndex === orderedSections.length - 1;

  return (
    <main className="mx-auto max-w-xl px-6 py-12">
      <h1 className="font-display mb-1 text-2xl">Hi {data.artist_name},</h1>
      <p className="mb-6 text-sm text-sand-muted">
        Please confirm your preferences for {data.event_name}.
      </p>

      {data.locked && <div className="mb-6"><LockedBanner /></div>}

      {orderedSections.length > 1 && (
        <div className="mb-6 flex items-center justify-center gap-2">
          {orderedSections.map((section, index) => {
            const complete = isSectionComplete(section, responseData);
            const active = index === currentIndex;
            return (
              <button
                key={section.id}
                type="button"
                onClick={() => setStepIndex(index)}
                aria-label={`Go to ${section.label}`}
                aria-current={active}
                className={`h-2.5 w-2.5 rounded-full transition-colors ${
                  active ? "bg-coral" : complete ? "bg-lagoon" : "bg-border"
                }`}
              />
            );
          })}
        </div>
      )}

      {currentSection && (
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="overflow-hidden rounded-lg border border-border-soft">
            <div className="border-b-2 border-lagoon bg-surface-raised px-4 py-3">
              <div className="eyebrow">
                Day {currentIndex + 1} of {orderedSections.length}
              </div>
              <h2 className="font-display text-xl text-sand">{currentSection.label}</h2>
              <p className="text-xs text-sand-muted">
                {new Date(`${currentSection.date}T00:00:00`).toLocaleDateString(undefined, {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
            <div className="flex flex-col gap-3 p-4">
              {currentSection.blocks.map((block) => {
                if (block.kind === "info") return <InfoBlockCard key={block.id} block={block} />;
                if (block.kind === "transport") return <TransportBlockCard key={block.id} block={block} />;
                return (
                  <FieldInput
                    key={block.id}
                    block={block}
                    value={responseData[block.id]}
                    onChange={(value) => setResponseData((prev) => ({ ...prev, [block.id]: value }))}
                    disabled={disabled}
                    notesValue={responseData[specialRequirementsKey(block.id)] as string | undefined}
                    onNotesChange={(value) =>
                      setResponseData((prev) => ({ ...prev, [specialRequirementsKey(block.id)]: value }))
                    }
                  />
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
              disabled={currentIndex === 0}
              className="rounded border border-border px-4 py-2 text-sm text-sand-muted hover:bg-surface-raised disabled:opacity-40"
            >
              Back
            </button>
            {!isLastStep && (
              <button
                type="button"
                onClick={() => setStepIndex((i) => Math.min(orderedSections.length - 1, i + 1))}
                className="rounded bg-ocean px-4 py-2 text-sm text-sand hover:bg-deep-marine"
              >
                Next: {orderedSections[currentIndex + 1]?.label}
              </button>
            )}
          </div>

          {submitError && !isLastStep && <p className="text-sm text-coral-bright">{submitError}</p>}

          {isLastStep && !data.locked && (
            <>
              <TurnstileWidget onToken={setTurnstileToken} onExpire={() => setTurnstileToken(null)} />
              {submitError && <p className="text-sm text-coral-bright">{submitError}</p>}
              <button
                type="submit"
                disabled={disabled}
                className="rounded bg-coral px-4 py-2 text-sand hover:bg-coral-bright disabled:opacity-50"
              >
                {submitting ? "Submitting…" : "Submit preferences"}
              </button>
            </>
          )}
        </form>
      )}
    </main>
  );
}
