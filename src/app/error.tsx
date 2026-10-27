"use client";

import Link from "next/link";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className="message-page"><p className="eyebrow">Dulmi & Isuru</p><h1>A little pause</h1><p>We couldn&apos;t load this page just now. Please try again in a moment.</p><button className="button button-primary" onClick={reset}>Try again</button><Link className="button button-quiet" href="/">Back to the welcome page</Link></main>;
}
