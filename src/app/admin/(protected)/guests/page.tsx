import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { loadInvitations, PAGE_SIZE } from "@/lib/admin-data";
import { GuestForm } from "@/components/admin/guest-form";
import { GuestOperations } from "@/components/admin/guest-operations";
import { CopyLinkButton } from "@/components/admin/copy-link-button";

export const metadata: Metadata = { title: "Guest List" };

function pageUrl(search: string, page: number) {
  const params = new URLSearchParams({ page: String(page) });
  if (search) params.set("q", search);
  return `/admin/guests?${params}`;
}

export default async function GuestsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const params = await searchParams;
  const search =
    typeof params.q === "string" ? params.q.trim().slice(0, 160) : "";
  const requestedPage =
    typeof params.page === "string" ? Number(params.page) : 1;
  const page =
    Number.isSafeInteger(requestedPage) &&
    requestedPage > 0 &&
    requestedPage <= 100000
      ? requestedPage
      : 1;
  const { invitations, count, error } = await loadInvitations(search, page);
  const { invitationUrl } = await import("@/lib/site");
  const pages = Math.max(1, Math.ceil(count / PAGE_SIZE));
  if (!error && page > pages) redirect(pageUrl(search, pages));
  return (
    <div className="space-y-8">
      <header>
        <p className="eyebrow">Your People</p>
        <h1 className="mt-2 text-4xl">The guest list.</h1>
        <p className="muted mt-3">A personal welcome, from the first click.</p>
      </header>
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
      <section aria-labelledby="guests-title" className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 id="guests-title" className="text-2xl">
              Invitations
            </h2>
            <p className="muted">
              {count} {search ? "matching " : ""}invitation
              {count === 1 ? "" : "s"}
            </p>
          </div>
          <form
            action="/admin/guests"
            method="get"
            className="flex w-full flex-wrap items-end gap-2 sm:w-auto"
            role="search"
          >
            <div className="field grow">
              <label htmlFor="guest-search">Search display names</label>
              <input
                id="guest-search"
                className="input"
                type="search"
                name="q"
                maxLength={160}
                defaultValue={search}
                placeholder="Find a guest"
              />
            </div>
            <button type="submit" className="button">
              Search
            </button>
            {search && (
              <Link href="/admin/guests" className="button button-quiet">
                Clear
              </Link>
            )}
          </form>
        </div>
        {error ? (
          <p className="error-message" role="alert">
            {error}
          </p>
        ) : invitations.length === 0 ? (
          <div className="panel empty-state">
            <h3 className="text-xl">
              {search
                ? "No matching invitations"
                : page > 1
                  ? "No invitations on this page"
                  : "Your guest list starts here"}
            </h3>
            <p className="muted mt-2">
              {search
                ? "Try another display name or clear your search."
                : page > 1
                  ? "Return to the first page to see your guests."
                  : "Prepare the first invitation using the form above."}
            </p>
            {page > 1 && (
              <Link href={pageUrl(search, 1)} className="button mt-4">
                First page
              </Link>
            )}
          </div>
        ) : (
          <div className="panel !p-0">
            <div
              className="table-scroll overflow-x-auto"
              tabIndex={0}
              role="region"
              aria-label="Guest invitations table"
            >
              <table className="guest-table w-full min-w-[760px] text-left">
                <caption className="sr-only">
                  Guest names, private invitation links, and management actions
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Guest</th>
                    <th scope="col">Token</th>
                    <th scope="col">Invitation link</th>
                    <th scope="col">Status</th>
                    <th scope="col">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {invitations.map((guest) => {
                    const url = invitationUrl(guest.token);
                    return (
                      <tr key={guest.id}>
                        <td className="align-top" data-label="Guest">
                          <p className="break-words font-medium">
                            {guest.display_name}
                          </p>
                          <p className="muted mt-1 break-words text-sm">
                            Guest record: {guest.guest_name}
                          </p>
                          <details className="mt-4">
                            <summary className="cursor-pointer text-sm underline underline-offset-4">
                              Edit guest details
                            </summary>
                            <div className="mt-4 min-w-64">
                              <GuestForm guest={guest} />
                            </div>
                          </details>
                        </td>
                        <td className="align-top max-w-40 break-all" data-label="Token"><code>{guest.token}</code></td>
                        <td className="align-top" data-label="Invitation link">
                          <p className="max-w-64 break-all font-mono text-xs">
                            {url}
                          </p>
                          <div className="mt-4 flex flex-wrap gap-2">
                            <CopyLinkButton key={guest.token} url={url} />
                            <a
                              className="button button-small button-quiet"
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Open
                              <span className="sr-only">
                                {" "}
                                invitation for {guest.display_name} in a new tab
                              </span>
                            </a>
                            <a
                              className="button button-small button-quiet"
                              href={`${url}?preview=1`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Preview
                              <span className="sr-only">
                                {" "}
                                invitation for {guest.display_name} in a new tab
                              </span>
                            </a>
                          </div>
                        </td>
                        <td className="align-top" data-label="Status">
                          <span
                            className="status"
                            data-is-active={guest.is_active}
                          >
                            {guest.is_active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="align-top" data-label="Actions">
                          <GuestOperations
                            id={guest.id}
                            is_active={guest.is_active}
                            name={guest.display_name}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {!error && (
          <nav
            aria-label="Guest list pages"
            className="flex flex-wrap items-center justify-between gap-4"
          >
            <p className="muted text-sm">
              Page {page} of {pages} / up to {PAGE_SIZE} per page
            </p>
            <div className="flex gap-2">
              {page > 1 && (
                <Link
                  className="button button-small"
                  href={pageUrl(search, page - 1)}
                >
                  Previous
                </Link>
              )}
              {page < pages && (
                <Link
                  className="button button-small"
                  href={pageUrl(search, page + 1)}
                >
                  Next
                </Link>
              )}
            </div>
          </nav>
        )}
      </section>
    </div>
  );
}
