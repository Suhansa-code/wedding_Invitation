"use client";

import { useEffect, useEffectEvent } from "react";
import { motion, useAnimate, useIsPresent } from "motion/react";
import useWeddingReducedMotion from "./useWeddingReducedMotion";
import EnvelopeFlap from "./EnvelopeFlap";
import WeddingInvitation from "./WeddingInvitation";

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
    const letter = scope.current?.querySelector<HTMLElement>("[data-envelope-card]");
    const artwork = letter?.querySelector<HTMLElement>(".opening-letter-artwork");
    const sizeArtwork = () => {
      if (!letter || !artwork) return;
      artwork.style.transform = `scale(${letter.clientWidth / artwork.offsetWidth})`;
      letter.style.height = `${artwork.offsetHeight * letter.clientWidth / artwork.offsetWidth}px`;
    };
    const observer = new ResizeObserver(sizeArtwork);
    if (letter) observer.observe(letter);
    if (artwork) observer.observe(artwork);
    sizeArtwork();
    async function openEnvelope() {
      if (reducedMotion || !CSS.supports("perspective", "1000px")) { complete(); return; }
      const ease = [0.22, 1, 0.36, 1] as const;
      try {
        // Decode the real illustration and local font before measuring the printed card.
        await Promise.all([
          document.fonts.ready,
          ...Array.from(root.querySelectorAll("img"), (image) => image.decode().catch(() => {})),
        ]);
        if (cancelled) return;
        sizeArtwork();
        await animate("[data-envelope]", { opacity: [0, 1], scale: [0.94, 1] }, { duration: 0.6, ease });
        if (cancelled) return;
        root.setAttribute("data-stage", "opening");
        await animate("[data-envelope-seal]", { opacity: 0, y: -18, scale: 0.9 }, { duration: 0.4, ease });
        if (cancelled) return;
        await animate("[data-envelope-flap]", { rotateX: -180 }, { duration: 1.4, ease: "easeInOut" });
        if (cancelled) return;
        // Move the opened hinge behind the letter before it leaves the pocket.
        const flap = scope.current?.querySelector<HTMLElement>("[data-envelope-flap]");
        if (flap) flap.style.zIndex = "1";
        await animate("[data-envelope-card]", { y: "-102%" }, { duration: 1.5, ease });
        if (cancelled) return;
        const card = scope.current?.querySelector<HTMLElement>("[data-envelope-card]");
        const cardWindow = scope.current?.querySelector<HTMLElement>(".opening-card-window");
        if (!card || !cardWindow || !artwork) { complete(); return; }
        cardWindow.style.zIndex = "8";
        cardWindow.style.clipPath = "none";
        const box = card.getBoundingClientRect();
        const mobile = globalThis.innerWidth < 480;
        const width = artwork.offsetWidth;
        const targetY = (mobile ? 0 : 24) - box.top - card.offsetHeight * 1.02;
        root.setAttribute("data-stage", "expanding");
        await Promise.all([
          animate(card, { y: targetY, scale: width / card.offsetWidth }, { duration: 0.8, ease }),
          animate("[data-envelope-paper]", { opacity: 0, y: 24 }, { duration: 0.8, ease }),
          animate(".envelope-dedication, .envelope-recipient", { opacity: 0 }, { duration: 0.4, ease }),
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
      <p className="envelope-dedication">A little envelope. A very special invitation.</p>
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
      <p className="envelope-recipient">Especially for <span>{guestName}</span></p>
    </motion.section>
  );
}
