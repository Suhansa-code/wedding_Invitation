import "server-only";
import { requireAdmin } from "./auth";

export type Invitation = {
  id: string;
  guest_name: string;
  title: string;
  display_name: string;
  token: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export const PAGE_SIZE = 25;

export async function loadInvitations(search: string, page: number) {
  const supabase = await requireAdmin();
  const offset = (page - 1) * PAGE_SIZE;
  let query = supabase
    .from("invitations")
    .select(
      "id,guest_name,title,display_name,token,is_active,created_at,updated_at",
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .order("id")
    .range(offset, offset + PAGE_SIZE - 1);
  if (search)
    query = query.ilike(
      "display_name",
      `%${search.replace(/[\\%_]/g, "\\$&")}%`,
    );
  try {
    const { data, count, error } = await query;
    if (error)
      return {
        invitations: [] as Invitation[],
        count: 0,
        error: "Guest records could not be loaded. Please try again.",
      };
    return {
      invitations: (data ?? []) as Invitation[],
      count: count ?? 0,
      error: null,
    };
  } catch {
    return {
      invitations: [] as Invitation[],
      count: 0,
      error: "Guest records could not be loaded. Please try again.",
    };
  }
}

export async function loadDashboard() {
  const supabase = await requireAdmin();
  try {
    const [total, activeCount] = await Promise.all([
      supabase.from("invitations").select("id", { count: "exact", head: true }),
      supabase
        .from("invitations")
        .select("id", { count: "exact", head: true })
        .eq("is_active", true),
    ]);
    if (total.error || activeCount.error) throw new Error("Unavailable");
    return {
      total: total.count ?? 0,
      activeCount: activeCount.count ?? 0,
      error: null,
    };
  } catch {
    return {
      total: 0,
      activeCount: 0,
      error: "Dashboard totals are temporarily unavailable.",
    };
  }
}
