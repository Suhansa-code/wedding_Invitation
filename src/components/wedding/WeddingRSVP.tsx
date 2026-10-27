"use client";

import { motion } from "motion/react";
import useWeddingReducedMotion from "./useWeddingReducedMotion";
import {
  weddingReducedRevealVariants,
  weddingRevealVariants,
} from "@/components/animation/motionVariants";
import { weddingConfig } from "@/lib/wedding-config";

export default function WeddingRSVP({ still = false }: { still?: boolean }) {
  const reducedMotion = useWeddingReducedMotion();

  return (
    <motion.section
      className="wedding-rsvp"
      aria-label="RSVP by telephone"
      initial={still || reducedMotion ? false : "hidden"}
      animate={still ? { opacity: 1, y: 0, transition: { duration: 0 } } : undefined}
      whileInView={still ? undefined : "visible"}
      viewport={{ once: true, amount: 0.2 }}
      variants={still ? undefined : reducedMotion ? weddingReducedRevealVariants : weddingRevealVariants}
    >
      <div className="wedding-divider" aria-hidden="true">
        <span />
        <svg viewBox="0 0 32 32" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M16 16C6 13 11 7 16 2c5 5 10 11 0 14Zm0 0c3-10 9-5 14 0-5 5-11 10-14 0Zm0 0c10 3 5 9 0 14-5-5-10-11 0-14Zm0 0C13 26 7 21 2 16c5-5 11-10 14 0Z" />
        </svg>
        <span />
      </div>
      <h2 className="wedding-rsvp-title">RSVP</h2>
      <div className="wedding-contacts">
        {weddingConfig.contacts.map((contact) => (
          <a className="wedding-contact" href={contact.href} key={contact.name}>
            {contact.name} - {contact.phone}
          </a>
        ))}
      </div>
    </motion.section>
  );
}
