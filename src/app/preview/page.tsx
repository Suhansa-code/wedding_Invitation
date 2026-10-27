import type { Metadata } from "next";
import InvitationReveal from "@/components/invitation-reveal";

export const metadata: Metadata = { title: "An Invitation", robots: { index: false, follow: false } };

export default function PreviewPage() {
  return <InvitationReveal guestName="Dear family & friends" sessionKey="generic-preview" />;
}
