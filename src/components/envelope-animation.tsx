"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";

export default function EnvelopeAnimation({ playing = false, decorative = false, frontOnly = false, seal }: { playing?: boolean; decorative?: boolean; frontOnly?: boolean; seal?: ReactNode }) {
  return (
    <motion.div
      className={`envelope ${playing ? "is-playing" : ""} ${decorative ? "envelope-decorative" : ""}`}
      initial={decorative || frontOnly ? false : { opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      aria-hidden={seal ? undefined : true}
    >
      {!frontOnly && <><div className="envelope-back" /><div className="envelope-inner" /></>}
      <div className="envelope-pocket" />
      {!frontOnly && <div className="envelope-flap"><div className="flap-paper" /></div>}
      {seal ?? <div className="wax-seal"><span>D <i>&</i> I</span></div>}
      <div className="envelope-border" />
    </motion.div>
  );
}
