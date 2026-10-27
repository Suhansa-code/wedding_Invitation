"use client";

import { motion } from "motion/react";
import useWeddingReducedMotion from "./useWeddingReducedMotion";
import {
  weddingReducedRevealVariants,
  weddingRevealVariants,
} from "@/components/animation/motionVariants";
import AnimatedMandala from "./AnimatedMandala";
import PersonalizedGuest from "./PersonalizedGuest";
import WeddingCouple from "./WeddingCouple";
import WeddingDate from "./WeddingDate";
import WeddingRSVP from "./WeddingRSVP";
import WeddingVenue from "./WeddingVenue";
import "./card.css";

export default function WeddingInvitation({ guestName, still = false }: { guestName: string; still?: boolean }) {
  const reducedMotion = useWeddingReducedMotion();

  return (
    <article className="wedding-invitation" aria-label="Dulmi and Isuru's wedding invitation">
      <div className="wedding-mandala-clip" aria-hidden="true">
        <AnimatedMandala static={still || Boolean(reducedMotion)} />
      </div>
      <motion.header
        className="wedding-heading"
        initial={still || reducedMotion ? false : "hidden"}
        animate={still ? { opacity: 1, y: 0, transition: { duration: 0 } } : undefined}
        whileInView={still ? undefined : "visible"}
        viewport={{ once: true, amount: 0.2 }}
        variants={still ? undefined : reducedMotion ? weddingReducedRevealVariants : weddingRevealVariants}
      >
        <h1 className="wedding-title">Wedding Invitation</h1>
        <p className="wedding-introduction">Together with our parents ,<br />We</p>
      </motion.header>
      <WeddingCouple still={still} />
      <PersonalizedGuest guestName={guestName} still={still} />
      <WeddingDate still={still} />
      <WeddingVenue still={still} />
      <WeddingRSVP still={still} />
    </article>
  );
}
