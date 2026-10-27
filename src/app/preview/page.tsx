import type { Metadata } from "next";
import InvitationExperience from "@/components/wedding/InvitationExperience";

export const metadata: Metadata = { title: "An Invitation", robots: { index: false, follow: false } };

export default function PreviewPage() {
  return <InvitationExperience guestName="family & friends" sessionKey="generic-preview" />;
}
