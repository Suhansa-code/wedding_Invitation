import type { Variants } from "motion/react";

export const weddingEase = [0.22, 1, 0.36, 1] as const;

export const weddingRevealVariants: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.85, ease: weddingEase },
  },
};

export const weddingReducedRevealVariants: Variants = {
  hidden: { opacity: 1 },
  visible: { opacity: 1, transition: { duration: 0 } },
};
