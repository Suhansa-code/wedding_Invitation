"use client";

import { motion } from "motion/react";
import useWeddingReducedMotion from "./useWeddingReducedMotion";
import {
  weddingReducedRevealVariants,
  weddingRevealVariants,
} from "@/components/animation/motionVariants";
import { weddingConfig } from "@/lib/wedding-config";
import "./card.css";

export default function WeddingActions({ onReplay }: { onReplay: () => void }) {
  const reducedMotion = useWeddingReducedMotion();

  return (
    <motion.nav
      className="wedding-actions"
      aria-label="Invitation actions"
      initial={reducedMotion ? false : "hidden"}
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      variants={reducedMotion ? weddingReducedRevealVariants : weddingRevealVariants}
    >
      <a className="wedding-action wedding-action-primary" href={weddingConfig.directions} target="_blank" rel="noopener noreferrer">
        Get Directions
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
          <path d="M7 17 17 7M7 7h10v10" />
        </svg>
      </a>
      {weddingConfig.contacts.map((contact) => (
        <a className="wedding-action" href={contact.href} key={contact.name}>Call {contact.name}</a>
      ))}
      <button className="wedding-action wedding-action-replay" type="button" onClick={onReplay}>
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
          <rect x="3" y="5" width="18" height="14" rx="1" />
          <path d="m3 6 9 7 9-7M3 19l6-7m12 7-6-7" />
        </svg>
        Replay Envelope
      </button>
    </motion.nav>
  );
}
