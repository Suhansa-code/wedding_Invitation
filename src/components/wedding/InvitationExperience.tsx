"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { preload } from "react-dom";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import useWeddingReducedMotion from "./useWeddingReducedMotion";
import WelcomeScene from "./WelcomeScene";
import EnvelopeScene from "./EnvelopeScene";
import WeddingInvitation from "./WeddingInvitation";
import WeddingActions from "./WeddingActions";
import "./experience.css";

type Scene = "welcome" | "envelope" | "invitation";
const subscribe = () => () => {};

export default function InvitationExperience({ guestName, sessionKey = "preview", preview = false }: { guestName: string; sessionKey?: string; preview?: boolean }) {
  const [scene, setScene] = useState<Scene>("welcome");
  const [interacted, setInteracted] = useState(false);
  const [envelopeComplete, setEnvelopeComplete] = useState(false);
  const reducedMotion = useWeddingReducedMotion();
  const contentRef = useRef<HTMLDivElement>(null);
  const storageKey = `di:opened:${sessionKey}`;
  const previouslyOpened = useSyncExternalStore(subscribe, () => {
    try { return sessionStorage.getItem(storageKey) === "1"; } catch { return false; }
  }, () => false);
  const activeScene = !interacted && (preview || previouslyOpened || reducedMotion) ? "invitation" : scene;
  const isInvitation = activeScene === "invitation";

  preload("/images/wedding-couple.webp", { as: "image", fetchPriority: "high" });

  function showInvitation() {
    if (!preview) {
      try { sessionStorage.setItem(storageKey, "1"); } catch { /* Optional session preference, never authorization. */ }
    }
    setInteracted(true);
    setScene("invitation");
  }

  useEffect(() => {
    if (!interacted) return;
    window.scrollTo({ top: 0, behavior: "instant" });
    // Focus after AnimatePresence has mounted the next scene, not the exiting button.
    contentRef.current?.focus({ preventScroll: true });
  }, [activeScene, interacted]);

  function focusScene() {
    if (interacted) contentRef.current?.focus({ preventScroll: true });
  }

  return (
    <MotionConfig reducedMotion="user">
      <main className={`invitation-experience scene-${activeScene}`}>
        <div ref={contentRef} className="experience-content" tabIndex={-1}>
          <AnimatePresence mode="wait" initial={false} onExitComplete={focusScene}>
            {activeScene === "welcome" ? (
              <WelcomeScene key="welcome" guestName={guestName} onOpen={() => { setInteracted(true); setScene(reducedMotion ? "invitation" : "envelope"); }} />
            ) : !isInvitation ? (
              <EnvelopeScene key="envelope" guestName={guestName} onComplete={() => { setEnvelopeComplete(true); showInvitation(); }} />
            ) : (
              <motion.div key="invitation" className="invitation-final" initial={reducedMotion || envelopeComplete ? false : { opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reducedMotion ? 0 : 0.2 }} onAnimationComplete={focusScene}>
                <WeddingInvitation guestName={guestName} still={envelopeComplete} />
                <WeddingActions onReplay={() => { setEnvelopeComplete(false); setInteracted(true); setScene("envelope"); }} />
                <motion.footer className="experience-footer" initial={reducedMotion ? false : { opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.8 }}>
                  We can’t wait to celebrate with you.<br /><span>With love, Dulmi &amp; Isuru</span>
                </motion.footer>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        {!isInvitation && <button className="experience-skip" onClick={showInvitation} type="button">Skip Animation <span aria-hidden="true">→</span></button>}
        <p className="sr-only" role="status">{isInvitation ? `Your invitation is open, ${guestName}.` : activeScene === "welcome" ? "Your personalized wedding invitation is ready." : "Opening your envelope."}</p>
        <noscript><p className="notice">JavaScript is needed for the animated experience. <a href="/images/wedding-invitation.png">View the original invitation artwork</a>.</p></noscript>
      </main>
    </MotionConfig>
  );
}
