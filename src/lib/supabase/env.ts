import "server-only";

export function supabaseUrl() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) return null;
  try {
    const parsed = new URL(url);
    const local = ["localhost", "127.0.0.1", "[::1]"].includes(parsed.hostname);
    if (parsed.username || parsed.password || parsed.search || parsed.hash || parsed.pathname !== "/") return null;
    if (parsed.protocol !== "https:" && !(process.env.NODE_ENV !== "production" && local && parsed.protocol === "http:")) return null;
    return parsed.origin;
  } catch {
    return null;
  }
}

export function supabaseConfig() {
  const url = supabaseUrl();
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  return { url, key };
}
