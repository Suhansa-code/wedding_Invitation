import Link from "next/link";
import EnvelopeAnimation from "@/components/envelope-animation";
import { ArrowIcon, Ornament } from "@/components/icons";

export default function Home() {
  return (
    <div className="landing">
      <header className="site-header"><Link className="monogram" href="/" aria-label="Dulmi and Isuru">D<span>&</span>I</Link><span className="header-note">A celebration of love</span></header>
      <main className="landing-main">
        <div className="landing-copy">
          <p className="eyebrow">Together with our families</p>
          <h1>Dulmi <span>&</span> Isuru</h1>
          <Ornament className="gold-ornament" />
          <p className="landing-message">Our next chapter begins.<br />It would mean the world to share it with you.</p>
          <Link href="/preview" className="button button-primary">Open the invitation <ArrowIcon /></Link>
          <p className="preview-note">A glimpse of our special day</p>
        </div>
        <div className="landing-envelope"><div className="envelope-halo" /><EnvelopeAnimation decorative /><p className="envelope-caption">Something wonderful is inside</p></div>
      </main>
      <footer className="site-footer"><span>Made with love, for the people we love.</span><Link href="/admin">Guest management <ArrowIcon diagonal /></Link></footer>
    </div>
  );
}
