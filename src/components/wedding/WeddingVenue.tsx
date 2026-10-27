"use client";

import { motion } from "motion/react";
import useWeddingReducedMotion from "./useWeddingReducedMotion";
import {
  weddingReducedRevealVariants,
  weddingRevealVariants,
} from "@/components/animation/motionVariants";
import { weddingConfig } from "@/lib/wedding-config";

export default function WeddingVenue({ still = false }: { still?: boolean }) {
  const reducedMotion = useWeddingReducedMotion();

  return (
    <motion.section
      className="wedding-venue"
      aria-label="Wedding venue"
      initial={still || reducedMotion ? false : "hidden"}
      animate={still ? { opacity: 1, y: 0, transition: { duration: 0 } } : undefined}
      whileInView={still ? undefined : "visible"}
      viewport={{ once: true, amount: 0.2 }}
      variants={still ? undefined : reducedMotion ? weddingReducedRevealVariants : weddingRevealVariants}
    >
      <p className="wedding-at">At</p>
      <h2 className="wedding-venue-name">{weddingConfig.venue}</h2>
      <address className="wedding-address">{weddingConfig.address}</address>
    </motion.section>
  );
}
