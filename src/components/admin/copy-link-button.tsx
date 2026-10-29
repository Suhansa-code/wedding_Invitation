"use client";

import { useState } from "react";

export function CopyLinkButton({ url }: { url: string }) {
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  async function copy() {
    setPending(true);
    try {
      await navigator.clipboard.writeText(url);
      setMessage("Link copied.");
    } catch {
      setMessage(
        "Clipboard unavailable. Select and copy the link shown above.",
      );
    } finally {
      setPending(false);
    }
  }
  return (
    <div>
      <button
        className="button button-small"
        type="button"
        disabled={pending}
        onClick={copy}
        aria-label="Copy link"
        data-copied={message === "Link copied."}
      >
        {pending ? "Copying..." : message === "Link copied." ? "Copied ✓" : "Copy link"}
      </button>
      <p role="status" className="copy-feedback muted mt-1 max-w-56 text-xs">
        {message}
      </p>
    </div>
  );
}
