import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { SignOutButton } from "@/components/admin/sign-out-button";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();
  return (
    <>
      <a
        href="#admin-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:bg-white focus:p-4"
      >
        Skip to content
      </a>
      <header className="admin-header flex flex-wrap items-center justify-between gap-5">
        <Link href="/admin" aria-label="Invitation Studio dashboard">
          <span className="eyebrow">Dulmi &amp; Isuru</span>
          <span className="mt-1 block text-xl">Invitation Studio</span>
        </Link>
        <nav
          className="admin-nav flex flex-wrap items-center gap-3"
          aria-label="Administration"
        >
          <Link href="/admin" className="button button-quiet">
            Overview
          </Link>
          <Link href="/admin/guests" className="button button-quiet">
            Guest list
          </Link>
          <SignOutButton />
        </nav>
      </header>
      <main id="admin-content" className="admin-main">
        {children}
      </main>
    </>
  );
}
