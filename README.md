# In Full Bloom — Dulmi & Isuru

A separate app inspired by the supplied 46-second wedding invitation video:
blush watercolor florals, an opening dedication, editorial couple/family details,
a calendar, countdown, venue, personal wishes and closing invitation.

The existing `../wedding_Invitation` app is not modified or imported at runtime.
This app has its own source, copied assets, server, Site identity and URL.

## Run locally

From this folder run `node server.cjs`, then open http://127.0.0.1:3001.
No dependency installation or build step is required. `dist/` is the complete
deployable app; `server.cjs` is a local preview server.

## Features

- Floral opening card and animated paper reveal; replay from the footer.
- Illustrated running frames derived from the selected original couple: the bride
  enters from the left and the bearded groom enters from the right, in the same
  ivory-and-gold outfits. The final hand-holding pose uses the unmodified original
  `assets/couple.webp`, also shown in the invitation. Replay restarts the entrance;
  reduced-motion visitors see the original couple immediately.
- Guest greeting via `?to=Amali%20%26%20family`. This is presentation-only
  personalization, not private invitation access or an authentication system.
- Responsive scrolling chapters, accessible mobile menu and scroll progress.
- Live wedding countdown, calendar download and directions/contact links.
- Optional original piano-style music; starts only when the music control is used.
- Petals can be paused. System reduced-motion settings are respected.
- Wishes are browser-local drafts. Preparing a wish does not send it. A separate
  WhatsApp link lets the visitor send it to Isuru; there is no shared guestbook or
  server-side RSVP service in this version.
- Content remains readable with JavaScript disabled.

## Content and assets

Wedding details are carried over from the existing app: 23 November 2026,
10 AM–4 PM Sri Lanka time, The Stallions Banquet Hall, Gonapola.
The couple illustration and local script font are copied into this project's
assets. No personal photos, reference-video frames, or other couple's names are
used as public assets. Video analysis frames remain in ignored `reference/`.

The floral background is an original built-in ImageGen asset. Its production
path and generation prompt are recorded in `ASSET_NOTES.md`. The optional music
is an original synthesized four-chord phrase; its reproducible source is retained
locally at `.tools/create-music.py` (tools are excluded from deployment).

Before sharing widely, confirm the family names, venue, contact numbers, event
times and calendar import, and check actual mobile/WhatsApp browsers. No backend
or admin credentials are needed to preview this app.
