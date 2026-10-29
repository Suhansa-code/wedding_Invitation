"use client";

import { motion } from "motion/react";
import useWeddingReducedMotion from "./useWeddingReducedMotion";
import type { Variants } from "motion/react";
import { weddingConfig } from "@/lib/wedding-config";
import AnimatedMandala from "./AnimatedMandala";
import { weddingEase } from "@/components/animation/motionVariants";

export default function WelcomeScene({ guestName, onOpen }: { guestName: string; onOpen: () => void }) {
  const reducedMotion = useWeddingReducedMotion();
  const reveal: Variants = {
    hidden: { opacity: reducedMotion ? 1 : 0, y: reducedMotion ? 0 : 20 },
    visible: { opacity: 1, y: 0, transition: { duration: reducedMotion ? 0 : 0.9, ease: weddingEase } },
  };
  return (
    <motion.section className="welcome-scene" initial={reducedMotion ? false : "hidden"} animate="visible" exit={{ opacity: 0, y: reducedMotion ? 0 : -24, scale: reducedMotion ? 1 : 0.98 }} transition={{ duration: reducedMotion ? 0 : 0.45, ease: weddingEase }} aria-labelledby="welcome-title">
      <AnimatedMandala className="welcome-mandala" />
      <motion.div className="welcome-copy" variants={{ visible: { transition: { delayChildren: reducedMotion ? 0 : 0.15, staggerChildren: reducedMotion ? 0 : 0.12 } } }}>
        <motion.p className="welcome-eyebrow" variants={reveal}>You Are Invited</motion.p>
        <motion.p className="welcome-subtitle" variants={reveal}>To the Wedding of</motion.p>
        <motion.h1 id="welcome-title" className="welcome-names" variants={reveal}>
          <motion.span variants={reveal}>{weddingConfig.bride.name}</motion.span>
          <motion.span className="welcome-ampersand" variants={reveal}> & </motion.span>
          <motion.span variants={reveal}>{weddingConfig.groom.name}</motion.span>
        </motion.h1>
        <motion.div className="welcome-divider" variants={reveal} aria-hidden="true"><motion.span initial={reducedMotion ? false : { scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 0.6, duration: 0.9, ease: weddingEase }} />✧<motion.span initial={reducedMotion ? false : { scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 0.6, duration: 0.9, ease: weddingEase }} /></motion.div>
        <motion.p className="welcome-date" variants={reveal}><time dateTime={weddingConfig.dateISO}>23 November 2026</time></motion.p>
        <motion.p className="welcome-guest" variants={reveal}>Dear <span>{guestName}</span></motion.p>
        <motion.button className="open-invitation" type="button" variants={reveal} whileHover={reducedMotion ? undefined : { scale: 1.025 }} whileTap={reducedMotion ? undefined : { scale: 0.98 }} onClick={onOpen}>
          Open My Invitation
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden="true"><path d="M4 12h15m-5-5 5 5-5 5" /></svg>
        </motion.button>
      </motion.div>
      <motion.p className="welcome-footnote" variants={reveal}>With our families, with all our love</motion.p>
    </motion.section>
  );
}
