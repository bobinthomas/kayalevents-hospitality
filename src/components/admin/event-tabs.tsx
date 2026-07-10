"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export const EVENT_TABS = [
  { slug: "roster", label: "Roster" },
  { slug: "templates", label: "Templates" },
  { slug: "forms", label: "Forms" },
  { slug: "responses", label: "Responses" },
] as const;

export type EventTabSlug = (typeof EVENT_TABS)[number]["slug"];

export function EventTabs({
  eventId,
  counts,
}: {
  eventId: string;
  counts: Record<EventTabSlug, number>;
}) {
  const pathname = usePathname();

  return (
    <nav className="mb-8 flex gap-4 border-b border-border">
      {EVENT_TABS.map((tab) => {
        const href = `/admin/events/${eventId}/${tab.slug}`;
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={tab.slug}
            href={href}
            className={`flex items-center gap-1.5 border-b-2 px-1 pb-2 text-sm ${
              active
                ? "border-coral text-sand"
                : "border-transparent text-sand-muted hover:border-lagoon hover:text-sand"
            }`}
          >
            {tab.label}
            <span
              className={`rounded-full px-1.5 py-0.5 text-xs ${
                active ? "bg-coral/20 text-coral-bright" : "bg-surface-raised text-sand-muted"
              }`}
            >
              {counts[tab.slug]}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
