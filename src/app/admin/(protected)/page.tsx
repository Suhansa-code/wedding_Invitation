import Link from "next/link";
import { loadDashboard } from "@/lib/admin-data";
import { GuestForm } from "@/components/admin/guest-form";

export default async function DashboardPage() {
  const totals = await loadDashboard();
  return (
    <div className="space-y-8">
      <section className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="eyebrow">The Guest Edit</p>
          <h1 className="mt-2 text-4xl">Every invitation, personal.</h1>
          <p className="muted mt-3">
            Thoughtfully prepared. Beautifully shared. All in one place.
          </p>
        </div>
        <Link href="#new-invitation" className="button button-primary">
          Create an invitation
        </Link>
      </section>
      {totals.error ? (
        <p role="alert" className="error-message">
          {totals.error}
        </p>
      ) : (
        <section
          className="grid gap-4 sm:grid-cols-3"
          aria-label="Invitation totals"
        >
          {[
            ["All invitations", totals.total],
            ["Active links", totals.activeCount],
            ["Inactive links", totals.total - totals.activeCount],
          ].map(([label, count]) => (
            <div key={label} className="panel">
              <p className="eyebrow">{label}</p>
              <p className="mt-4 text-5xl tabular-nums">{count}</p>
            </div>
          ))}
        </section>
      )}
      <section
        id="new-invitation"
        className="panel scroll-mt-6"
        aria-labelledby="create-title"
      >
        <h2 id="create-title" className="mb-5 text-2xl">
          Prepare an invitation
        </h2>
        <GuestForm />
      </section>
      <section className="panel max-w-3xl">
        <p className="eyebrow">A Thoughtful Detail</p>
        <h2 className="mt-3 text-2xl">One guest. One special link.</h2>
        <p className="muted mt-3">
          Create a guest, choose the name they will see, and share their private
          invitation link. Editing a name keeps the same link. Regenerating it
          replaces the link entirely.
        </p>
        <p className="muted mt-3">
          Treat invitation links like private keepsakes. Anyone with a link can
          open it, so share them directly and avoid posting them publicly.
        </p>
        <Link href="/admin/guests" className="button mt-5">
          Manage the guest list
        </Link>
      </section>
    </div>
  );
}
