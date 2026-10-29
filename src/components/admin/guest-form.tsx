"use client";

import { useActionState, useId, useState } from "react";
import {
  createInvitationAction,
  updateInvitationAction,
  type ActionState,
} from "@/app/admin/actions";
import { titlePresets } from "@/lib/validation";
import type { Invitation } from "@/lib/admin-data";
import { CopyLinkButton } from "./copy-link-button";

export function GuestForm({ guest }: { guest?: Invitation }) {
  const prefix = useId();
  const [name, setName] = useState(guest?.guest_name ?? "");
  const [title, setTitle] = useState(guest?.title ?? "");
  const [displayName, setDisplayName] = useState(guest?.display_name ?? "");
  const [customDisplay, setCustomDisplay] = useState(!!guest);
  const [mode, setMode] = useState("auto");
  const [state, action, pending] = useActionState<ActionState, FormData>(
    async (previous, form) => {
      const result = await (
        guest ? updateInvitationAction : createInvitationAction
      )(previous, form);
      if (result.success && !guest) {
        setName("");
        setTitle("");
        setDisplayName("");
        setCustomDisplay(false);
        setMode("auto");
      }
      return result;
    },
    {},
  );
  const suggestedName = [title, name.trim()].filter(Boolean).join(" ");
  return (
    <form action={action} className="space-y-5" aria-busy={pending}>
      {guest && <input type="hidden" name="id" value={guest.id} />}
      <fieldset disabled={pending} className="space-y-5">
        <legend className="sr-only">
          {guest ? "Edit invitation guest" : "New invitation details"}
        </legend>
        <div
          className={
            guest ? "space-y-4" : "form-grid grid gap-4 md:grid-cols-2"
          }
        >
          <div className="field">
            <label htmlFor={`${prefix}-name`}>Guest name</label>
            <input
              id={`${prefix}-name`}
              name="guest_name"
              className="input"
              autoComplete="off"
              maxLength={160}
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Nimal & Kumari Perera"
            />
          </div>
          <div className="field">
            <label htmlFor={`${prefix}-title`}>Title</label>
            <select
              id={`${prefix}-title`}
              name="title"
              className="input"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            >
              {titlePresets.map((value) => (
                <option key={value} value={value}>
                  {value || "No title"}
                </option>
              ))}
            </select>
          </div>
          <div className="field md:col-span-2">
            <label htmlFor={`${prefix}-display`}>Name on the invitation</label>
            <input
              id={`${prefix}-display`}
              name="display_name"
              className="input"
              maxLength={160}
              required
              value={customDisplay ? displayName : suggestedName}
              onChange={(event) => {
                setCustomDisplay(true);
                setDisplayName(event.target.value);
              }}
              aria-describedby={`${prefix}-display-hint`}
            />
            <p id={`${prefix}-display-hint`} className="muted mt-1 text-sm">
              Exactly as your guest will see it. You can customize this
              independently.
            </p>
            <button
              type="button"
              className="button button-small button-quiet mt-2"
              onClick={() => setCustomDisplay(false)}
            >
              Use title and guest name
            </button>
          </div>
        </div>
        {!guest && (
          <div className="space-y-4">
            <div className="field">
              <label htmlFor={`${prefix}-mode`}>Invitation link</label>
              <select
                id={`${prefix}-mode`}
                name="token_mode"
                className="input"
                value={mode}
                onChange={(event) => setMode(event.target.value)}
              >
                <option value="auto">
                  Automatic / secure random link (recommended)
                </option>
                <option value="custom">Choose a custom link token</option>
              </select>
            </div>
            {mode === "custom" && (
              <div className="field">
                <label htmlFor={`${prefix}-token`}>Custom token</label>
                <input
                  id={`${prefix}-token`}
                  name="custom_token"
                  className="input"
                  required
                  minLength={8}
                  maxLength={128}
                  autoCapitalize="none"
                  autoComplete="off"
                  spellCheck={false}
                  placeholder="a-private-celebration"
                  aria-describedby={`${prefix}-token-hint`}
                />
                <p id={`${prefix}-token-hint`} className="muted mt-1 text-sm">
                  8-128 letters, numbers, hyphens, or underscores. Spaces become
                  hyphens; custom tokens are lowercased. Human-readable custom
                  tokens are guessable and are not secrets. Avoid personal
                  information.
                </p>
              </div>
            )}
          </div>
        )}
        {guest && (
          <p className="muted text-sm">
            Saving these details will not change the invitation link.
          </p>
        )}
        <div className="form-actions">
          <button className="button button-primary" type="submit" aria-busy={pending}>
            {pending
              ? "Saving..."
              : guest
                ? "Save guest details"
                : "Generate Invitation Link"}
          </button>
        </div>
      </fieldset>
      <div aria-live="polite">
        {state.error && (
          <p className="error-message" role="alert">
            {state.error}
          </p>
        )}
        {state.success && (
          <p className="notice" role="status">
            {state.success}
          </p>
        )}
        {state.invitation && (
          <section
            className="panel mt-4 space-y-3"
            aria-label="Generated invitation"
          >
            <p className="eyebrow">Ready For Your Guest</p>
            <p className="break-words text-xl font-medium">
              {state.invitation.display_name}
            </p>
            <p className="break-all font-mono text-sm">
              {state.invitation.url}
            </p>
            <div className="flex flex-wrap items-start gap-2">
              <CopyLinkButton
                key={state.invitation.url}
                url={state.invitation.url}
              />
              <a
                className="button button-small button-quiet"
                href={state.invitation.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                Open
                <span className="sr-only">
                  {" "}
                  invitation for {state.invitation.display_name} in a new tab
                </span>
              </a>
              <a
                className="button button-small button-quiet"
                href={`${state.invitation.url}?preview=1`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Preview
                <span className="sr-only">
                  {" "}
                  invitation for {state.invitation.display_name} in a new tab
                </span>
              </a>
            </div>
          </section>
        )}
      </div>
    </form>
  );
}
