"use client";

import { motion } from "motion/react";
import useWeddingReducedMotion from "./useWeddingReducedMotion";
import {
  weddingReducedRevealVariants,
  weddingRevealVariants,
} from "@/components/animation/motionVariants";
import { weddingConfig } from "@/lib/wedding-config";

export default function WeddingDate({ still = false }: { still?: boolean }) {
  const reducedMotion = useWeddingReducedMotion();

  return (
    <motion.section
      className="wedding-date-section"
      aria-label="Wedding date and time"
      initial={still || reducedMotion ? false : "hidden"}
      animate={still ? { opacity: 1, y: 0, transition: { duration: 0 } } : undefined}
      whileInView={still ? undefined : "visible"}
      viewport={{ once: true, amount: 0.2 }}
      variants={still ? undefined : reducedMotion ? weddingReducedRevealVariants : weddingRevealVariants}
    >
      <time className="wedding-date" dateTime={weddingConfig.dateISO} aria-label={weddingConfig.dateLabel}>
        <strong className="wedding-month">{weddingConfig.date.month}</strong>
        <span className="wedding-date-center">
          <span className="wedding-weekday">{weddingConfig.date.weekday}</span>
          <strong className="wedding-day">{weddingConfig.date.day}</strong>
        </span>
        <strong className="wedding-year">{weddingConfig.date.year}</strong>
      </time>
      <p className="wedding-time">FROM {weddingConfig.time}</p>
    </motion.section>
  );
}
