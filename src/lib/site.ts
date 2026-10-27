function configuredSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!configured) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("NEXT_PUBLIC_SITE_URL must be configured in production.");
    }
    return "http://localhost:3000";
  }
  const url = new URL(configured);
  if (
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    url.pathname !== "/"
  ) {
    throw new Error(
      "NEXT_PUBLIC_SITE_URL must be an origin without a path or credentials.",
    );
  }
  const local = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  if (
    url.protocol !== "https:" &&
    !(
      process.env.NODE_ENV !== "production" &&
      local &&
      url.protocol === "http:"
    )
  ) {
    throw new Error(
      "NEXT_PUBLIC_SITE_URL must use HTTPS (HTTP localhost is allowed in development).",
    );
  }
  return url.origin;
}

export const siteUrl = configuredSiteUrl();

export function invitationUrl(token: string): string {
  return `${siteUrl}/invite/${encodeURIComponent(token)}`;
}
