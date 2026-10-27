import Link from "next/link";
import { Ornament } from "@/components/icons";

export default function InvitationNotFound() {
  return <main className="message-page"><Ornament /><p className="eyebrow">Dulmi & Isuru</p><h1>Invitation not found</h1><p>This link may be incorrect or is no longer active.<br />Please ask the couple for your invitation link.</p><Link className="button" href="/">Back to the welcome page</Link></main>;
}
