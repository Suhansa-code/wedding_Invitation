import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import StudioNav from "@/components/admin/studio-nav";

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
        <StudioNav />
      </header>
      <main id="admin-content" className="admin-main">
        {children}
      </main>
    </>
  );
}
