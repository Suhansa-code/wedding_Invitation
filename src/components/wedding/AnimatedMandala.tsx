"use client";

import { motion } from "motion/react";
import useWeddingReducedMotion from "./useWeddingReducedMotion";
import artwork from "@/lib/mandala-artwork.json";

export default function AnimatedMandala({ className, static: still = false }: { className?: string; static?: boolean }) {
  const reducedMotion = useWeddingReducedMotion();
  return (
    <svg className={className} viewBox={artwork.viewBox} fill="none" aria-hidden="true" focusable="false">
      <motion.path
        d={artwork.path}
        fill="currentColor"
        fillRule="evenodd"
        stroke="currentColor"
        strokeWidth={0.6}
        initial={still || reducedMotion ? false : { pathLength: 0, fillOpacity: 0, opacity: 0.5 }}
        whileInView={{ pathLength: 1, fillOpacity: 1, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ pathLength: { duration: 2.2, ease: "easeInOut" }, fillOpacity: { delay: 1.4, duration: 1 }, opacity: { duration: 0.7 } }}
      />
    </svg>
  );
}
