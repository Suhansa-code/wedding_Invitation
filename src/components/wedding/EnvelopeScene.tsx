"use client";

import { useEffect, useEffectEvent } from "react";
import { motion, useAnimate, useIsPresent } from "motion/react";
import useWeddingReducedMotion from "./useWeddingReducedMotion";
import EnvelopeFlap from "./EnvelopeFlap";
import WeddingInvitation from "./WeddingInvitation";
import { weddingEase } from "@/components/animation/motionVariants";

export default function EnvelopeScene({ guestName, onComplete }: { guestName: string; onComplete: () => void }) {
  const [scope, animate] = useAnimate<HTMLDivElement>();
  const reducedMotion = useWeddingReducedMotion();
  const isPresent = useIsPresent();
  const complete = useEffectEvent(onComplete);

  useEffect(() => {
    if (!isPresent) return;
    let cancelled = false;
    const root = scope.current;
    const controls = scope.animations;
    const envelope = root.querySelector<HTMLElement>("[data-envelope]");
    const letter = scope.current?.querySelector<HTMLElement>("[data-envelope-card]");
    const artwork = letter?.querySelector<HTMLElement>(".opening-letter-artwork");
    const sizeArtwork = () => {
      if (!letter || !artwork || !envelope || !artwork.offsetHeight) return;
      // Match the mailer's proportions to the actual card, including wrapped guest names.
      envelope.style.setProperty("--envelope-ratio", `${artwork.offsetWidth / artwork.offsetHeight}`);
      artwork.style.transform = `scale(${letter.clientWidth / artwork.offsetWidth})`;
      letter.style.height = `${artwork.offsetHeight * letter.clientWidth / artwork.offsetWidth}px`;
    };
    const observer = new ResizeObserver(sizeArtwork);
    if (letter) observer.observe(letter);
    if (artwork) observer.observe(artwork);
    sizeArtwork();
    async function openEnvelope() {
      if (reducedMotion || !CSS.supports("perspective", "1000px")) { complete(); return; }
      const ease = weddingEase;
      try {
        // Decode the real illustration and local font before measuring the printed card.
        await Promise.all([
          document.fonts.ready,
          ...Array.from(root.querySelectorAll("img"), (image) => image.decode().catch(() => {})),
        ]);
        if (cancelled) return;
        sizeArtwork();
        await animate("[data-envelope]", { opacity: [0, 1], y: [32, 0], rotate: [-4, 0], scale: [0.92, 1] }, { duration: 0.85, ease });
        if (cancelled) return;
        root.setAttribute("data-stage", "opening");
        await animate("[data-envelope-seal]", { opacity: [1, 1, 0], y: -30, x: 12, rotate: -16, scale: [1, 1.08, 0.9] }, { duration: 0.5, ease });
        if (cancelled) return;
        await animate("[data-envelope-flap]", { rotateX: -180 }, { duration: 1.15, ease: [0.45, 0, 0.2, 1] });
        if (cancelled) return;
        // Move the opened hinge behind the letter before it leaves the pocket.
        const flap = scope.current?.querySelector<HTMLElement>("[data-envelope-flap]");
        if (flap) flap.style.zIndex = "1";
        if (!letter || !envelope) { complete(); return; }
        const letterTop = letter.getBoundingClientRect().top;
        const emergedTop = Math.max(24, (window.innerHeight - letter.offsetHeight) / 2 - 48);
        const extractedY = emergedTop - letterTop;
        // Let the larger envelope fall away while the complete card rises into view.
        // Moving the shell avoids pulling a tall card above the viewport.
        await Promise.all([
          animate(letter, { y: extractedY }, { duration: 1.35, ease }),
          animate("[data-envelope-paper], [data-envelope-flap]", { y: window.innerHeight - envelope.getBoundingClientRect().top + 32 }, { duration: 1.35, ease }),
          animate(".envelope-dedication, .envelope-recipient", { opacity: 0 }, { duration: 0.35, ease }),
        ]);
        if (cancelled) return;
        const card = scope.current?.querySelector<HTMLElement>("[data-envelope-card]");
        const cardWindow = scope.current?.querySelector<HTMLElement>(".opening-card-window");
        if (!card || !cardWindow || !artwork) { complete(); return; }
        cardWindow.style.zIndex = "8";
        cardWindow.style.clipPath = "none";
        const box = card.getBoundingClientRect();
        const mobile = globalThis.innerWidth < 480;
        const width = artwork.offsetWidth;
        const targetY = extractedY + (mobile ? 0 : 24) - box.top;
        root.setAttribute("data-stage", "expanding");
        await Promise.all([
          animate(card, { y: targetY, scale: width / card.offsetWidth, boxShadow: "0 12px 48px #49381312" }, { duration: 1, ease }),
          animate("[data-envelope-paper]", { opacity: 0 }, { duration: 0.75, ease }),
        ]);
        if (!cancelled) {
          root.setAttribute("data-stage", "complete");
          complete();
        }
      } catch {
        // A browser without a supported animation implementation can still read the card.
        if (!cancelled) complete();
      }
    }
    void openEnvelope();
    return () => {
      cancelled = true;
      observer.disconnect();
      controls.forEach((control) => control.stop());
    };
  }, [animate, reducedMotion, scope, isPresent]);

  return (
    <motion.section ref={scope} className="envelope-scene" data-stage="appearing" initial={false} exit={{ opacity: 0, transition: { duration: 0 } }} aria-label="Opening your invitation" tabIndex={-1}>
      <div className="envelope-light" aria-hidden="true" />
      <motion.p className="envelope-dedication" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: weddingEase }}>A little envelope. A very special invitation.</motion.p>
      <div className="opening-envelope" data-envelope aria-hidden="true">
        <div className="opening-back" data-envelope-paper />
        <div className="opening-card-window" inert>
          <div className="opening-letter" data-envelope-card>
            <div className="opening-letter-artwork"><WeddingInvitation guestName={guestName} still /></div>
          </div>
        </div>
        <div className="opening-pocket" data-envelope-paper />
        <EnvelopeFlap />
        <div className="opening-seal-position" data-envelope-seal><div className="opening-seal">D<span>&amp;</span>I</div></div>
      </div>
      <motion.p className="envelope-recipient" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, duration: 0.8, ease: weddingEase }}>Especially for <span>{guestName}</span></motion.p>
    </motion.section>
  );
}
