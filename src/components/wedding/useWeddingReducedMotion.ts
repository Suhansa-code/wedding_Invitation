"use client";

import { useSyncExternalStore } from "react";
import { useReducedMotion } from "motion/react";

const subscribe = () => () => {};

export default function useWeddingReducedMotion() {
  const preference = useReducedMotion();
  // The first hydration render must match the server, which cannot read media queries.
  return useSyncExternalStore(subscribe, () => Boolean(preference), () => false);
}
