"use client";

import { useActionState } from "react";
import { loginAction, type ActionState } from "@/app/admin/actions";

export function LoginForm({ configured }: { configured: boolean }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(
    loginAction,
    {},
  );
  return (
    <form action={action} className="space-y-5">
      <div className="field">
        <label htmlFor="admin-email">Email address</label>
        <input
          className="input"
          id="admin-email"
          name="email"
          type="email"
          autoComplete="username"
          maxLength={254}
          required
          disabled={!configured || pending}
        />
      </div>
      <div className="field">
        <label htmlFor="admin-password">Password</label>
        <input
          className="input"
          id="admin-password"
          name="password"
          type="password"
          autoComplete="current-password"
          maxLength={1024}
          required
          disabled={!configured || pending}
        />
      </div>
      <div aria-live="polite">
        {state.error && (
          <p className="error-message" role="alert">
            {state.error}
          </p>
        )}
      </div>
      <button
        className="button button-primary w-full"
        type="submit"
        disabled={!configured || pending}
      >
        {pending ? "Signing in..." : "Sign in to the studio"}
      </button>
    </form>
  );
}
