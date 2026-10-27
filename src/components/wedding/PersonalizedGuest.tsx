"use client";

import { motion } from "motion/react";
import useWeddingReducedMotion from "./useWeddingReducedMotion";
import {
  weddingReducedRevealVariants,
  weddingRevealVariants,
} from "@/components/animation/motionVariants";

export default function PersonalizedGuest({ guestName, still = false }: { guestName: string; still?: boolean }) {
  const reducedMotion = useWeddingReducedMotion();

  return (
    <motion.section
      className="wedding-personalization"
      aria-label="Our invitation to you"
      initial={still || reducedMotion ? false : "hidden"}
      animate={still ? { opacity: 1, y: 0, transition: { duration: 0 } } : undefined}
      whileInView={still ? undefined : "visible"}
      viewport={{ once: true, amount: 0.2 }}
      variants={still ? undefined : reducedMotion ? weddingReducedRevealVariants : weddingRevealVariants}
    >
      <p className="wedding-request">Request the honour of the presence of</p>
      <div className="wedding-guest-line">
        <span className="wedding-guest-dots" aria-hidden="true" />
        <span className="guest-name" data-testid="guest-name">{guestName}</span>
        <span className="wedding-guest-dots" aria-hidden="true" />
      </div>
      <p className="wedding-request">To celebrate our wedding</p>
    </motion.section>
  );
}
