import type { CSSProperties } from "react";

/** Deterministic decoration keeps the server and hydration markup identical. */
export default function WeddingAtmosphere() {
  return (
    <div className="wedding-atmosphere" aria-hidden="true">
      <div className="wedding-wash wedding-wash-left" />
      <div className="wedding-wash wedding-wash-right" />
      <div className="wedding-petals">
        {Array.from({ length: 24 }, (_, index) => <span key={index} style={{
          "--petal-left": `${(index * 37 + 5) % 96}%`,
          "--petal-top": `${(index * 23 + 3) % 86}%`,
          "--petal-size": `${9 + index % 4 * 2}px`,
          "--petal-delay": `${-(index % 8) * .35}s`,
        } as CSSProperties} />)}
      </div>
      <div className="wedding-motes">
        {Array.from({ length: 10 }, (_, index) => <span key={index} />)}
      </div>
    </div>
  );
}
