import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseConfig } from "./env";

export async function createAuthenticatedClient() {
  const config = supabaseConfig();
  if (!config) throw new Error("Authentication is not configured.");
  const store = await cookies();
  return createServerClient(config.url, config.key, {
    cookieOptions: {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    },
    global: {
      fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }),
    },
    cookies: {
      getAll: () => store.getAll(),
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet)
            store.set(name, value, options);
        } catch {
          // Server Components cannot write cookies. The proxy refreshes them first.
        }
      },
    },
  });
}
