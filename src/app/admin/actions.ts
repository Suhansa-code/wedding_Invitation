"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createAuthenticatedClient } from "@/lib/supabase/server";
import { supabaseConfig } from "@/lib/supabase/env";
import { generateInvitationToken } from "@/lib/tokens";
import {
  createInvitationSchema,
  invitationIdSchema,
  loginSchema,
  normalizeCustomToken,
  updateInvitationSchema,
} from "@/lib/validation";

export type ActionState = {
  error?: string;
  success?: string;
  invitation?: { display_name: string; url: string };
};

export async function loginAction(
  _previous: ActionState,
  form: FormData,
): Promise<ActionState> {
  if (!supabaseConfig())
    return {
      error: "Authentication is not configured. Contact the site owner.",
    };
  const parsed = loginSchema.safeParse({
    email: form.get("email"),
    password: form.get("password"),
  });
  if (!parsed.success)
    return { error: "Enter a valid email address and password." };
  let authorized = false;
  try {
    const supabase = await createAuthenticatedClient();
    const { error } = await supabase.auth.signInWithPassword(parsed.data);
    if (!error) {
      const {
        data: { user },
        error: verificationError,
      } = await supabase.auth.getUser();
      if (user && !verificationError) {
        const membership = await supabase
          .from("admin_users")
          .select("user_id")
          .eq("user_id", user.id)
          .maybeSingle();
        authorized = !membership.error && !!membership.data;
      }
      if (!authorized) await supabase.auth.signOut({ scope: "local" });
    }
  } catch {
    return { error: "Sign-in is unavailable. Please wait and try again." };
  }
  if (!authorized)
    return {
      error:
        "Unable to sign in with administrator access. Check your details or try again later.",
    };
  redirect("/admin");
}

export async function logoutAction(): Promise<ActionState> {
  try {
    // Clearing one's own session must still work after administrator access is revoked.
    const supabase = await createAuthenticatedClient();
    const { error } = await supabase.auth.signOut({ scope: "local" });
    if (error) return { error: "Could not sign out. Please try again." };
  } catch {
    return { error: "Could not sign out. Please try again." };
  }
  redirect("/admin/login");
}

function fields(form: FormData) {
  return {
    guest_name: form.get("guest_name"),
    title: form.get("title"),
    display_name: form.get("display_name"),
  };
}

function refreshGuests() {
  revalidatePath("/admin");
  revalidatePath("/admin/guests");
}

export async function createInvitationAction(
  _previous: ActionState,
  form: FormData,
): Promise<ActionState> {
  const supabase = await requireAdmin();
  const parsed = createInvitationSchema.safeParse({
    ...fields(form),
    token_mode: form.get("token_mode"),
    custom_token: form.get("custom_token") ?? "",
  });
  if (!parsed.success)
    return {
      error: parsed.error.issues[0]?.message ?? "Check the invitation details.",
    };
  const { token_mode, custom_token, ...guest } = parsed.data;
  let invitation: NonNullable<ActionState["invitation"]>;
  try {
    const token =
      token_mode === "auto"
        ? generateInvitationToken()
        : normalizeCustomToken(custom_token);
    // Validate the canonical origin before creating a record we cannot share.
    const { invitationUrl } = await import("@/lib/site");
    const url = invitationUrl(token);
    const { error } = await supabase.from("invitations").insert({
      ...guest,
      token,
    });
    if (error)
      return {
        error:
          error.code === "23505"
            ? "That invitation link is already in use. Choose another token."
            : "The invitation could not be created. Please try again.",
      };
    invitation = { display_name: guest.display_name, url };
  } catch {
    return { error: "The invitation could not be created. Please try again." };
  }
  refreshGuests();
  return {
    success: "Invitation link generated. Ready to share with your guest.",
    invitation,
  };
}

export async function updateInvitationAction(
  _previous: ActionState,
  form: FormData,
): Promise<ActionState> {
  const supabase = await requireAdmin();
  const parsed = updateInvitationSchema.safeParse({
    ...fields(form),
    id: form.get("id"),
  });
  if (!parsed.success)
    return {
      error: parsed.error.issues[0]?.message ?? "Check the guest details.",
    };
  const { id, ...guest } = parsed.data;
  try {
    const { data, error } = await supabase
      .from("invitations")
      .update(guest)
      .eq("id", id)
      .select("id")
      .maybeSingle();
    if (error || !data)
      return {
        error:
          "Guest details could not be saved. Refresh the page and try again.",
      };
  } catch {
    return { error: "Guest details could not be saved. Please try again." };
  }
  refreshGuests();
  return {
    success: "Guest details saved. The invitation link has not changed.",
  };
}

export async function changeInvitationAction(
  _previous: ActionState,
  form: FormData,
): Promise<ActionState> {
  const supabase = await requireAdmin();
  const id = invitationIdSchema.safeParse(form.get("id"));
  const operation = form.get("operation");
  if (
    !id.success ||
    !["deactivate", "activate", "regenerate"].includes(String(operation))
  )
    return { error: "Invalid invitation operation." };
  try {
    const changes =
      operation === "regenerate"
        ? { token: generateInvitationToken() }
        : { is_active: operation === "activate" };
    const { data, error } = await supabase
      .from("invitations")
      .update(changes)
      .eq("id", id.data)
      .select("id")
      .maybeSingle();
    if (error || !data)
      return {
        error: "The invitation could not be updated. Refresh and try again.",
      };
  } catch {
    return { error: "The invitation could not be updated. Please try again." };
  }
  refreshGuests();
  return {
    success:
      operation === "regenerate"
        ? "New link generated. The previous link no longer works."
        : operation === "activate"
          ? "Invitation activated."
          : "Invitation deactivated. Its link no longer works.",
  };
}
