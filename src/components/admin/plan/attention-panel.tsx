"use client";

import Link from "next/link";
import type { AttentionItem } from "@/lib/plan-view-model";

const ACTION_LABEL: Record<AttentionItem["action"], string> = {
  send: "Send now",
  nudge: "Nudge",
  review: "Review",
};

/** Replaces the old flat "Not yet responded" list — surfaces anything that needs a human to act, each with an inline action, and hides entirely once there's nothing left to do. */
export function AttentionPanel({ items, eventId }: { items: AttentionItem[]; eventId: string }) {
  if (items.length === 0) return null;

  return (
    <div className="rounded-lg border border-coral/40 bg-coral/10 p-4">
      <h2 className="mb-3 font-display text-lg text-sand">Needs attention ({items.length})</h2>
      <ul className="flex flex-col gap-2">
        {items.map((item, i) => (
          <li
            key={`${item.formId}-${item.action}-${i}`}
            className="flex items-center justify-between gap-3 rounded border border-border bg-surface px-3 py-2"
          >
            <div className="text-sm">
              <span className="font-medium text-sand">{item.artistName}</span>{" "}
              <span className="text-sand-muted">
                ({item.artistRole}) — {item.reason}
              </span>
            </div>
            <AttentionAction item={item} eventId={eventId} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function AttentionAction({ item, eventId }: { item: AttentionItem; eventId: string }) {
  const className =
    "shrink-0 rounded border border-ocean/40 px-2 py-1 text-xs text-ocean hover:bg-ocean/20";

  if (item.action === "send") {
    return (
      <Link href={`/admin/events/${eventId}/forms/${item.formId}`} className={className}>
        {ACTION_LABEL.send}
      </Link>
    );
  }

  if (item.action === "review") {
    return (
      <Link href={`/admin/events/${eventId}/responses/${item.formId}`} className={className}>
        {ACTION_LABEL.review}
      </Link>
    );
  }

  // TODO: no nudge endpoint exists yet (no email/SMS reminder integration) —
  // wire this up to one when it does. For now it's a visible no-op so the
  // panel doesn't silently drop the "opened but stalled" case.
  return (
    <button
      type="button"
      onClick={() => console.warn("TODO: nudge not yet wired up for form", item.formId)}
      className={className}
    >
      {ACTION_LABEL.nudge}
    </button>
  );
}
