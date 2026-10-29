"use client";

import { startTransition, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MotionConfig, motion, type Variants } from "motion/react";
import EnvelopeAnimation from "./envelope-animation";
import { ArrowIcon, Ornament } from "./icons";
import useWeddingReducedMotion from "./wedding/useWeddingReducedMotion";
import { weddingEase } from "./animation/motionVariants";
import WeddingAtmosphere from "./wedding/WeddingAtmosphere";

const reveal: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.85, ease: weddingEase } },
};

export default function WeddingLanding() {
  const router = useRouter();
  const reducedMotion = useWeddingReducedMotion();
  const [leaving, setLeaving] = useState(false);
  const navigating = useRef(false);

  return (
    <MotionConfig reducedMotion="user">
      <motion.div className="landing-transition" data-active={leaving} initial={false} animate={{ opacity: leaving ? 1 : 0 }} transition={{ duration: 0.35, ease: weddingEase }} aria-hidden="true">
        <span className="monogram">D<span>&amp;</span>I</span>
        <span className="landing-transition-line" />
        <p>An invitation, just for you</p>
      </motion.div>
      <motion.div
        className="landing"
        initial={reducedMotion ? false : "hidden"}
        animate={leaving ? "leaving" : "visible"}
        variants={{
          hidden: { opacity: 1 },
          visible: { opacity: 1, y: 0, transition: { staggerChildren: 0.12, delayChildren: 0.08 } },
          leaving: { opacity: 0, y: -18, transition: { duration: 0.45, ease: weddingEase } },
        }}
        onAnimationComplete={(definition) => {
          if (definition === "leaving") {
            startTransition(() => {
              router.push("/preview?open=1");
              setLeaving(false);
              navigating.current = false;
            });
          }
        }}
        aria-busy={leaving}
      >
        <WeddingAtmosphere />
        <noscript><style>{".landing [style] { opacity: 1 !important; transform: none !important; }"}</style></noscript>
        <motion.header className="site-header" variants={reveal}>
          <Link className="monogram" href="/" aria-label="Dulmi and Isuru">D<span>&</span>I</Link>
          <span className="header-note">A celebration of love</span>
        </motion.header>
        <main className="landing-main">
          <motion.div className="landing-copy" variants={{ visible: { transition: { staggerChildren: 0.11 } } }}>
            <motion.p className="eyebrow" variants={reveal}>Together with our families</motion.p>
            <motion.h1 variants={reveal}>Dulmi <span>&</span> Isuru</motion.h1>
            <motion.div variants={reveal}><Ornament className="gold-ornament" /></motion.div>
            <motion.p className="landing-message" variants={reveal}>Our next chapter begins.<br />It would mean the world to share it with you.</motion.p>
          </motion.div>
          <motion.div className="landing-envelope-arrival" variants={{
            hidden: { opacity: 0, y: 34, rotate: 3, scale: 0.96 },
            visible: { opacity: 1, y: 0, rotate: 0, scale: 1, transition: { duration: 1.3, delay: 0.25, ease: weddingEase } },
          }}>
            <div className="landing-envelope">
              <div className="envelope-halo" />
              <div className="landing-envelope-paper">
                <EnvelopeAnimation decorative seal={
                  <Link
                    href="/preview?open=1"
                    className="wax-seal wax-seal-link"
                    aria-label="Open envelope"
                    title="Open envelope"
                    onNavigate={(event) => {
                      if (reducedMotion) return;
                      event.preventDefault();
                      if (navigating.current) return;
                      navigating.current = true;
                      setLeaving(true);
                    }}
                  >
                    <span aria-hidden="true">D <i>&amp;</i> I</span>
                  </Link>
                } />
              </div>
              <p className="envelope-caption">Tap the seal to open</p>
            </div>
          </motion.div>
        </main>
        <motion.footer className="site-footer" variants={reveal}>
          <span>Made with love, for the people we love.</span>
          <Link href="/admin">Guest management <ArrowIcon diagonal /></Link>
        </motion.footer>
        <span className="sr-only" role="status">{leaving ? "Opening your invitation." : ""}</span>
      </motion.div>
    </MotionConfig>
  );
}
