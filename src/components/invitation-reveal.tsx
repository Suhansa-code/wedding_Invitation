"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useReducedMotion } from "motion/react";
import EnvelopeAnimation from "./envelope-animation";
import WeddingInvitation from "./wedding-invitation";
import { ArrowIcon, Ornament } from "./icons";

type Phase = "loading" | "playing" | "open" | "missing";

export default function InvitationReveal({ guestName, sessionKey = "preview", preview = false }: { guestName: string; sessionKey?: string; preview?: boolean }) {
  const [phase, setPhase] = useState<Phase>("loading");
  const [ready, setReady] = useState(false);
  const [replay, setReplay] = useState(0);
  const [skip, setSkip] = useState(false);
  const reducedMotion = useReducedMotion();
  const storageKey = `di:opened:${sessionKey}`;

  function markOpened() {
    if (preview) return;
    try { sessionStorage.setItem(storageKey, "1"); } catch { /* Storage may be disabled in private browsers. */ }
  }

  useEffect(() => {
    if (!ready) return;
    let alreadyOpened = false;
    try { alreadyOpened = sessionStorage.getItem(storageKey) === "1"; } catch { /* The animation still works without storage. */ }
    const unsupported = typeof CSS === "undefined" || !CSS.supports("perspective", "1000px") || !CSS.supports("animation-name", "card-reveal");
    const bypass = skip || reducedMotion || unsupported || (preview && replay === 0) || (alreadyOpened && replay === 0);
    const start = window.setTimeout(() => setPhase(bypass ? "open" : "playing"), 0);
    const finish = window.setTimeout(() => {
      setPhase("open");
      if (!preview) {
        try { sessionStorage.setItem(storageKey, "1"); } catch { /* Nonessential persistence. */ }
      }
    }, bypass ? 0 : 4750);
    return () => { clearTimeout(start); clearTimeout(finish); };
  }, [ready, reducedMotion, replay, storageKey, skip, preview]);

  // A stalled image request should not leave a guest waiting indefinitely.
  useEffect(() => {
    if (ready) return;
    const timeout = setTimeout(() => setPhase("missing"), 20000);
    return () => clearTimeout(timeout);
  }, [ready]);

  const opened = phase === "open";
  return (
    <main className={`invitation-page phase-${phase}`}>
      <Link className="monogram invitation-monogram" href="/" aria-label="Dulmi and Isuru home">D<span>&</span>I</Link>
      <div className="reveal-intro" aria-hidden={opened || phase === "missing"}>
        <p className="eyebrow">A little envelope. A lot of love.</p>
        <p className="reveal-dedication">Especially for you</p>
      </div>
      {phase === "missing" ? (
        <section className="artwork-notice panel" role="status">
          <Ornament />
          <h1>The invitation is being prepared</h1>
          <p>The original printed artwork has not been added yet, or could not be loaded. Please try again shortly.</p>
          <button className="button" onClick={() => location.reload()}>Try again</button>
        </section>
      ) : (
        <div className={`reveal-scene ${phase === "playing" ? "is-playing" : ""}`} key={replay}>
          {!opened && <div className="reveal-envelope envelope-underlay" aria-hidden="true"><div className="envelope-back" /><div className="envelope-inner" /></div>}
          {!opened && <div className="reveal-envelope envelope-hinge" aria-hidden="true"><div className="envelope-flap"><div className="flap-paper" /></div></div>}
          <div className="revealing-card" aria-hidden={!opened} inert={!opened}>
            <WeddingInvitation guestName={guestName} onReady={() => setReady(true)} onError={() => setPhase("missing")} />
          </div>
          {!opened && <div className="reveal-envelope"><EnvelopeAnimation playing={phase === "playing"} frontOnly /></div>}
        </div>
      )}
      <p className="sr-only" role="status">{opened ? `Your invitation is open, ${guestName}.` : phase === "loading" ? "Preparing your invitation." : phase === "playing" ? "Opening your envelope." : "Invitation artwork unavailable."}</p>
      {!opened && phase !== "missing" && (
        <button className="skip-button" onClick={() => { setSkip(true); markOpened(); }} disabled={skip}>
          {skip && !ready ? "Preparing invitation..." : "Skip animation"} <ArrowIcon />
        </button>
      )}
      {opened && (
        <div className="invitation-actions">
          <a className="button button-primary" href="https://maps.app.goo.gl/QGAZavf3ThqrCqGQ8" target="_blank" rel="noopener noreferrer">Get directions <ArrowIcon diagonal /></a>
          <button className="button button-quiet" onClick={() => { setSkip(false); setPhase("loading"); setReplay((value) => value + 1); }}>Replay envelope</button>
        </div>
      )}
      <noscript><p className="notice">JavaScript is needed for the envelope and personalized overlay. <a href="/images/wedding-invitation.png">View the original invitation artwork</a>.</p></noscript>
      <footer className="invitation-footer">With love, Dulmi & Isuru <span aria-hidden="true">&middot;</span> 2026</footer>
    </main>
  );
}
