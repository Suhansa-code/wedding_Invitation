"use client";

import { useActionState } from "react";
import { logoutAction, type ActionState } from "@/app/admin/actions";

export function SignOutButton() {
  const [state, action, pending] = useActionState<ActionState, FormData>(
    logoutAction,
    {},
  );
  return (
    <form action={action}>
      <button className="button button-small" type="submit" disabled={pending}>
        {pending ? "Signing out..." : "Sign out"}
      </button>
      {state.error && (
        <p className="error-message mt-2 text-sm" role="alert">
          {state.error}
        </p>
      )}
    </form>
  );
}
