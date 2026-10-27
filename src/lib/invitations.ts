import "server-only";
import { createClient } from "@supabase/supabase-js";
import { unstable_noStore as noStore } from "next/cache";
import { tokenSchema } from "./validation";
import { supabaseUrl } from "./supabase/env";

export async function resolveInvitation(
  token: string,
): Promise<{ display_name: string } | null> {
  noStore();
  const parsed = tokenSchema.safeParse(token);
  if (!parsed.success) return null;
  const url = supabaseUrl();
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error("Invitation service is unavailable.");
  try {
    const supabase = createClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
      global: {
        fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }),
      },
    });
    const { data, error } = await supabase
      .from("invitations")
      .select("display_name")
      .eq("token", parsed.data)
      .eq("is_active", true)
      .maybeSingle();
    if (error) throw new Error("Invitation lookup failed.");
    return data ? { display_name: data.display_name as string } : null;
  } catch {
    throw new Error("Invitation service is unavailable.");
  }
}
