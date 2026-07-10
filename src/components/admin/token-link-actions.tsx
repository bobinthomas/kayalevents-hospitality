"use client";

import { useState, useSyncExternalStore } from "react";

function subscribe() {
  return () => {};
}

function getOrigin() {
  return window.location.origin;
}

function getServerOrigin() {
  return "";
}

export function TokenLinkActions({ token }: { token: string }) {
  const [copied, setCopied] = useState(false);
  const origin = useSyncExternalStore(subscribe, getOrigin, getServerOrigin);
  const url = origin ? `${origin}/f/${token}` : "";

  async function handleCopy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex items-center gap-3 rounded border border-border bg-surface p-3 text-sm">
      <code className="flex-1 truncate text-sand-muted">{url}</code>
      <button onClick={handleCopy} className="rounded bg-coral px-3 py-1.5 text-sand hover:bg-coral-bright">
        {copied ? "Copied!" : "Copy link"}
      </button>
      <a
        href={`https://wa.me/?text=${encodeURIComponent(url)}`}
        target="_blank"
        rel="noreferrer"
        className="rounded bg-lagoon px-3 py-1.5 text-sand hover:bg-lagoon-bright"
      >
        Open in WhatsApp
      </a>
    </div>
  );
}
