import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/admin/login-form";
import { supabaseConfig } from "@/lib/supabase/env";
import { SignOutButton } from "@/components/admin/sign-out-button";

export const metadata: Metadata = { title: "Administrator Sign In" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  const { notice } = await searchParams;
  const configured = !!supabaseConfig();
  return (
    <main className="admin-main flex min-h-screen items-center justify-center px-4 py-12">
      <section className="panel w-full max-w-md" aria-labelledby="login-title">
        <p className="eyebrow">Dulmi &amp; Isuru / Private Studio</p>
        <h1 id="login-title" className="mt-3 text-3xl">
          A little care, for every guest.
        </h1>
        <p className="muted mb-6 mt-3">
          Sign in to prepare and manage your wedding invitations.
        </p>
        {!configured && (
          <p className="notice mb-5" role="status">
            Administrator sign-in is not configured yet. Set the Supabase URL
            and publishable key on the server.
          </p>
        )}
        {configured && notice === "access" && (
          <p className="notice mb-5" role="status">
            Please sign in with an approved administrator account to continue.
          </p>
        )}
        <LoginForm configured={configured} />
        {configured && notice === "access" && <div className="mt-5"><SignOutButton /></div>}
        <Link href="/" className="button button-quiet mt-5">
          Return to the invitation
        </Link>
      </section>
    </main>
  );
}
