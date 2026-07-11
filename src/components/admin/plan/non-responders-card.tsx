import { StatusBadge } from "@/components/admin/status-badge";
import type { NonResponder } from "@/lib/plan-aggregation";

export function NonRespondersCard({ nonResponders }: { nonResponders: NonResponder[] }) {
  if (nonResponders.length === 0) return null;

  return (
    <div className="rounded-lg border border-coral/40 bg-coral/10 p-4">
      <h2 className="mb-3 font-display text-lg text-sand">
        Not yet responded ({nonResponders.length})
      </h2>
      <ul className="flex flex-col gap-2">
        {nonResponders.map((artist, i) => (
          <li
            key={`${artist.artistName}-${i}`}
            className="flex items-center justify-between rounded border border-border bg-surface px-3 py-2"
          >
            <div>
              <span className="font-medium text-sand">{artist.artistName}</span>{" "}
              <span className="text-sm text-sand-muted">{artist.artistRole}</span>
              {(artist.phone || artist.email) && (
                <div className="text-xs text-sand-muted">
                  {[artist.phone, artist.email].filter(Boolean).join(" · ")}
                </div>
              )}
            </div>
            <StatusBadge status={artist.status} deadline={artist.deadline} />
          </li>
        ))}
      </ul>
    </div>
  );
}
