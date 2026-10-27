"use client";

import { useLayoutEffect, useRef } from "react";

export default function GuestNameOverlay({ name }: { name: string }) {
  const textRef = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const text = textRef.current;
    if (!text) return;
    const band = text.parentElement!;
    const fit = () => {
      // Measure against the fixed name band, never the surrounding printed text.
      const cardWidth = band.parentElement!.clientWidth;
      if (!cardWidth || !band.clientHeight) return;
      let size = cardWidth * 0.0315;
      text.style.fontSize = `${size}px`;
      while ((text.scrollHeight > band.clientHeight || text.scrollWidth > text.clientWidth + 1) && size > cardWidth * 0.0085) {
        size -= 0.25;
        text.style.fontSize = `${size}px`;
      }
    };
    const observer = new ResizeObserver(fit);
    observer.observe(band);
    fit();
    return () => observer.disconnect();
  }, [name]);

  return <div className="guest-name-overlay" data-testid="guest-name"><span className="guest-dots" aria-hidden="true" /><span className="guest-name" ref={textRef}>{name}</span><span className="guest-dots" aria-hidden="true" /></div>;
}
