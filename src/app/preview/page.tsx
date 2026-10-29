import type { Metadata } from "next";
import InvitationExperience from "@/components/wedding/InvitationExperience";

export const metadata: Metadata = { title: "An Invitation", robots: { index: false, follow: false } };

export default async function PreviewPage({ searchParams }: { searchParams: Promise<{ open?: string }> }) {
  const { open } = await searchParams;
  return <InvitationExperience key={open === "1" ? "opening" : "welcome"} guestName="family & friends" sessionKey="generic-preview" startWithEnvelope={open === "1"} />;
}
