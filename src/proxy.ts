import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { supabaseConfig } from "@/lib/supabase/env";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const config = supabaseConfig();
  if (config) {
    try {
      const supabase = createServerClient(config.url, config.key, {
        cookieOptions: {
          httpOnly: true,
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
          path: "/",
        },
        cookies: {
          getAll: () => request.cookies.getAll(),
          setAll(cookiesToSet, headers) {
            for (const { name, value } of cookiesToSet)
              request.cookies.set(name, value);
            const previous = response;
            response = NextResponse.next({ request });
            for (const cookie of previous.cookies.getAll())
              response.cookies.set(cookie);
            for (const { name, value, options } of cookiesToSet)
              response.cookies.set(name, value, options);
            // SSR 0.12 supplies cache-control headers alongside refreshed cookies.
            new Headers(headers).forEach((value, name) =>
              response.headers.set(name, value),
            );
          },
        },
      });
      await supabase.auth.getUser();
    } catch {
      // Private loaders independently verify the user and fail closed.
    }
  }
  if (!response.headers.has("Cache-Control"))
    response.headers.set("Cache-Control", "private, no-store, max-age=0");
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  return response;
}

export const config = { matcher: ["/admin/:path*"] };
