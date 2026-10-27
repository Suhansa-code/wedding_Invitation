"use client";

import { useEffect, useRef } from "react";
import GuestNameOverlay from "./guest-name-overlay";

export default function WeddingInvitation({ guestName, onReady, onError }: { guestName: string; onReady: () => void; onError: () => void }) {
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const image = imageRef.current;
    if (!image?.complete) return;
    // Cached/preloaded images can finish before React hydrates their event handlers.
    if (!image.naturalWidth) { onError(); return; }
    image.closest<HTMLElement>(".wedding-card")?.style.setProperty("--card-ratio", `${image.naturalWidth} / ${image.naturalHeight}`);
    let cancelled = false;
    void image.decode().catch(() => {}).then(() => { if (!cancelled) onReady(); });
    return () => { cancelled = true; };
  }, [onReady, onError]);

  return (
    <div className="wedding-card">
      {/* The approved asset is deliberately rendered unmodified, including its original proportions. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={imageRef}
        src="/images/wedding-invitation.png"
        alt="The original wedding invitation for Dulmi and Isuru. Monday, 23 November 2026, 10 AM to 4 PM at The Stallions Banquet Hall, No. B/2 Nayagoda Road, Gonapola. RSVP Isuru 076 210 1024 or Dulmi 077 222 8796."
        width={1056}
        height={1490}
        loading="eager"
        fetchPriority="high"
        decoding="async"
        onLoad={async (event) => {
          const image = event.currentTarget;
          image.closest<HTMLElement>(".wedding-card")?.style.setProperty("--card-ratio", `${image.naturalWidth} / ${image.naturalHeight}`);
          try { await image.decode(); } catch { /* A loaded image can already be decoded. */ }
          onReady();
        }}
        onError={onError}
      />
      <GuestNameOverlay name={guestName} />
    </div>
  );
}
