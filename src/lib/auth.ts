import "server-only";
import { redirect } from "next/navigation";
import { createAuthenticatedClient } from "./supabase/server";
import { supabaseConfig } from "./supabase/env";

export async function requireAdmin() {
  if (!supabaseConfig()) redirect("/admin/login?notice=configuration");
  const supabase = await createAuthenticatedClient().catch(() => null);
  if (!supabase) redirect("/admin/login?notice=access");
  let authorized = false;
  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (user && !error) {
      const membership = await supabase
        .from("admin_users")
        .select("user_id")
        .eq("user_id", user.id)
        .maybeSingle();
      authorized = !membership.error && !!membership.data;
    }
  } catch {
    authorized = false;
  }
  if (!authorized) redirect("/admin/login?notice=access");
  return supabase;
}
