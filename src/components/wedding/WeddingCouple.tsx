"use client";

import Image from "next/image";
import { motion } from "motion/react";
import useWeddingReducedMotion from "./useWeddingReducedMotion";
import {
  weddingReducedRevealVariants,
  weddingRevealVariants,
} from "@/components/animation/motionVariants";
import { weddingConfig } from "@/lib/wedding-config";

export default function WeddingCouple({ still = false }: { still?: boolean }) {
  const reducedMotion = useWeddingReducedMotion();

  return (
    <motion.section
      className="wedding-couple"
      aria-label="The bride and groom and their families"
      initial={still || reducedMotion ? false : "hidden"}
      animate={still ? { opacity: 1, y: 0, transition: { duration: 0 } } : undefined}
      whileInView={still ? undefined : "visible"}
      viewport={{ once: true, amount: 0.2 }}
      variants={still ? undefined : reducedMotion ? weddingReducedRevealVariants : weddingRevealVariants}
    >
      <div className="wedding-person wedding-bride">
        <h2 className="wedding-person-name">{weddingConfig.bride.name}</h2>
        <p className="wedding-family">{weddingConfig.bride.parents}<br />{weddingConfig.bride.family}</p>
      </div>
      <Image
        className="wedding-couple-image"
        src="/images/wedding-couple.webp"
        alt="Dulmi and Isuru in traditional wedding attire, holding hands"
        width={246}
        height={374}
        unoptimized
        loading="eager"
        sizes="(max-width: 479px) 26vw, (max-width: 680px) 24vw, 164px"
      />
      <div className="wedding-person wedding-groom">
        <h2 className="wedding-person-name">{weddingConfig.groom.name}</h2>
        <p className="wedding-family">{weddingConfig.groom.parents}<br />{weddingConfig.groom.family}</p>
      </div>
    </motion.section>
  );
}
