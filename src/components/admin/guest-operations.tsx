"use client";

import { useActionState } from "react";
import { changeInvitationAction, type ActionState } from "@/app/admin/actions";

export function GuestOperations({
  id,
  is_active,
  name,
}: {
  id: string;
  is_active: boolean;
  name: string;
}) {
  const [state, action, pending] = useActionState<ActionState, FormData>(
    changeInvitationAction,
    {},
  );
  return (
    <div className="mt-4 max-w-64 space-y-3">
      <form
        action={action}
        onSubmit={(event) => {
          if (
            !window.confirm(
              is_active
                ? `Deactivate the invitation for ${name}? Its link will stop working.`
                : `Reactivate the invitation for ${name}? Its existing link will work again.`,
            )
          )
            event.preventDefault();
        }}
      >
        <input type="hidden" name="id" value={id} />
        <input
          type="hidden"
          name="operation"
          value={is_active ? "deactivate" : "activate"}
        />
        <button
          type="submit"
          disabled={pending}
          className="button button-small button-quiet"
        >
          {is_active ? "Deactivate" : "Reactivate"}
        </button>
      </form>
      <form
        action={action}
        onSubmit={(event) => {
          if (
            !window.confirm(
              `Replace the invitation link for ${name}? The old link will immediately stop working. You must share the new link again.`,
            )
          )
            event.preventDefault();
        }}
      >
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="operation" value="regenerate" />
        <button
          type="submit"
          disabled={pending}
          className="button button-small button-quiet"
        >
          Regenerate link
        </button>
      </form>
      <div aria-live="polite">
        {pending && <p className="muted text-sm">Updating invitation...</p>}
        {state.error && (
          <p className="error-message text-sm" role="alert">
            {state.error}
          </p>
        )}
        {state.success && (
          <p className="notice text-sm" role="status">
            {state.success}
          </p>
        )}
      </div>
    </div>
  );
}
