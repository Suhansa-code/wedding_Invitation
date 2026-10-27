import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createHash } from "node:crypto";
import InvitationExperience from "@/components/wedding/InvitationExperience";
import { resolveInvitation } from "@/lib/invitations";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const metadata: Metadata = {
  title: "You're Invited",
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false, noimageindex: true } },
  referrer: "no-referrer",
};

export default async function InvitationPage({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<{ preview?: string }> }) {
  const { token } = await params;
  const { preview } = await searchParams;
  const invitation = await resolveInvitation(token);
  if (!invitation) notFound();
  const sessionKey = createHash("sha256").update(token).digest("hex").slice(0, 24);
  return <InvitationExperience key={`${sessionKey}:${preview === "1"}`} guestName={invitation.display_name} sessionKey={sessionKey} preview={preview === "1"} />;
}
