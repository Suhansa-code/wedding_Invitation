# UI and UX review

Reviewed the landing page, generic preview, personalized welcome and envelope
reveal, final card and guest actions, unavailable/error/loading states, studio
sign-in, dashboard, guest creation/editing, search/pagination, copy-link feedback,
and activation/regeneration flows.

## Improvements implemented

- **One action from the landing seal:** the seal now starts the envelope sequence
  directly. A second opening button was an unnecessary step for the generic tour.
  Personalized invitations retain their named welcome, and repeat visits still
  respect the existing opened-session preference.
- **More rose petals:** increased from 8 to 24 petals on desktop and 18 on mobile,
  with varied sizes, blush/gold tones and alternating drift directions. Decoration
  sits behind content, cannot intercept input, settles after the entrance, and
  disappears with reduced motion. Increased the small gold accents from 6 to 10.
- **Useful guest actions:** grouped directions, calls and a downloadable calendar
  event under a clear heading. The event uses the configured wedding date and
  10 AM–4 PM Sri Lanka time, encoded in UTC. Mobile actions use a two-column layout.
- **Studio orientation:** the active navigation item is visually highlighted and
  exposes `aria-current`. Inactive invitations have a distinct neutral badge.
- **Form confidence:** added a password visibility toggle, stronger field focus
  treatment, visible pending indicators, and a copied-state button. Clipboard
  failures still explain how to copy manually. Status space reduces layout jumps.
- **Responsive polish:** larger mobile studio targets, consistent panel surfaces,
  row hover/focus feedback, and short entrances for studio pages, edit sections,
  feedback messages and recovery screens. Reduced motion suppresses these effects.

## Remaining launch checks

- Verify real Supabase sign-in and guest operations against the hosted project;
  local browser tests use the repository's isolated fixture service.
- Review the experience on physical iPhones/Android phones and WhatsApp browsers.
- Confirm the calendar event imports in the couple's intended calendar apps and
  confirm all wedding details before distributing links.

The original artwork, guest personalization, private-link rules and destructive
operation confirmations remain part of the existing application behavior.
