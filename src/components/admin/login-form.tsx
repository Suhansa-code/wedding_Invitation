"use client";

import { useActionState, useState } from "react";
import { loginAction, type ActionState } from "@/app/admin/actions";

export function LoginForm({ configured }: { configured: boolean }) {
  const [showPassword, setShowPassword] = useState(false);
  const [state, action, pending] = useActionState<ActionState, FormData>(
    loginAction,
    {},
  );
  return (
    <form action={action} className="space-y-5" aria-busy={pending}>
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
          type={showPassword ? "text" : "password"}
          autoComplete="current-password"
          maxLength={1024}
          required
          disabled={!configured || pending}
        />
        <button type="button" className="password-toggle" aria-controls="admin-password" aria-pressed={showPassword} onClick={() => setShowPassword(!showPassword)} disabled={!configured || pending}>
          {showPassword ? "Hide password" : "Show password"}
        </button>
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
        aria-busy={pending}
      >
        {pending ? "Signing in..." : "Sign in to the studio"}
      </button>
    </form>
  );
}
