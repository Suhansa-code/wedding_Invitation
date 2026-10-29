"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignOutButton } from "./sign-out-button";

export default function StudioNav() {
  const pathname = usePathname();
  return <nav className="admin-nav flex flex-wrap items-center gap-3" aria-label="Administration">
    {[["/admin", "Overview"], ["/admin/guests", "Guest list"]].map(([href, label]) => (
      <Link key={href} href={href} className="button button-quiet" aria-current={pathname === href ? "page" : undefined}>{label}</Link>
    ))}
    <SignOutButton />
  </nav>;
}
