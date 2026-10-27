"use client";

export default function AdminError({ reset }: { reset: () => void }) {
  return (
    <main className="admin-main">
      <section className="panel" role="alert">
        <p className="eyebrow">Invitation Studio</p>
        <h1 className="mt-3 text-3xl">Something needs a moment.</h1>
        <p className="muted my-4">
          The administrator page could not be loaded. Please try again. No
          private error details have been displayed.
        </p>
        <button className="button button-primary" onClick={reset}>
          Try again
        </button>
        <a href="/admin/login" className="button button-quiet ml-3">
          Sign in
        </a>
      </section>
    </main>
  );
}
