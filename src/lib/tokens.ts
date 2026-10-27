import "server-only";
import { randomBytes } from "node:crypto";

export function generateInvitationToken(): string {
  return randomBytes(24).toString("base64url");
}
