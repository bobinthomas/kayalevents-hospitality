"use client";

import { useRef } from "react";
import Script from "next/script";

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: { sitekey: string; callback: (token: string) => void; "expired-callback"?: () => void }
      ) => string;
    };
  }
}

export function TurnstileWidget({
  onToken,
  onExpire,
}: {
  onToken: (token: string) => void;
  onExpire: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  if (!siteKey) {
    // No site key configured — skip the widget (matches the existing
    // kayalevents repo's dev/pre-provisioning convention).
    return null;
  }

  return (
    <div>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js"
        strategy="afterInteractive"
        onLoad={() => {
          if (containerRef.current && window.turnstile) {
            window.turnstile.render(containerRef.current, {
              sitekey: siteKey,
              callback: onToken,
              "expired-callback": onExpire,
            });
          }
        }}
      />
      <div ref={containerRef} />
    </div>
  );
}
