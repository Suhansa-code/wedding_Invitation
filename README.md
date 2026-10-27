# Dulmi & Isuru Wedding Invitation

A Next.js App Router application with an animated welcome and envelope experience, a personalized HTML/SVG wedding invitation, and a Supabase-backed administrator studio. React client components handle the scenes, invitation, and forms; server components and server actions handle invitation lookup, authentication, and administration. Supabase provides Auth and PostgreSQL with row-level security (RLS).

The original artwork remains at `public/images/wedding-invitation.png` as a design reference and unpersonalized fallback, not the rendered full-card image. `WeddingInvitation` recreates the invitation with HTML text, an SVG mandala, the real couple crop, and a local script font. `InvitationExperience` coordinates `WelcomeScene`, `EnvelopeScene`, and the final invitation. **Before launch:** configure a live Supabase project, apply both migrations, and verify the deployed invitation on actual guest devices. Automated backend and browser tests are included; they do not replace live Supabase verification.

## Current Deployment

- Website: https://dulmi-isuru-invitation.vercel.app
- Envelope preview: https://dulmi-isuru-invitation.vercel.app/preview
- Administrator login: https://dulmi-isuru-invitation.vercel.app/admin/login
- Vercel project: https://vercel.com/suhansa/dulmi-isuru-invitation

The previous public website was deployed and verified on desktop and mobile Chromium on 27 October 2026; that record does not verify deployment of the new HTML/SVG scene implementation. **Supabase is not configured on this deployment yet:** admin sign-in is disabled, no administrator password has been created, and personalized guest links are not operational. Complete the Supabase setup below, add its three environment values to the Vercel project, and redeploy before distributing personalized invitations. `NEXT_PUBLIC_SITE_URL` is already configured to the production origin.

The initial release was uploaded from a Git-free copy of the current working tree because Vercel rejected the repository commit author's team membership. The source repository and its author details were not modified. Automatic Git deployments are not configured; resolve the author membership or use an owner-authorized source upload for subsequent releases. The account's older `wedding` project was left unchanged.

## Local Development

Use **Node.js 22** (`.nvmrc` specifies `22`) and npm. From this directory:

```bash
nvm use 22
npm ci
```

Create `.env.local` using the keys in `.env.example`, fill in your project's values, and then run:

```bash
npm run dev
```

Open `http://localhost:3000`. The landing page and generic `/preview` do not require database records; the HTML/SVG invitation does not depend on loading the full original PNG. Admin access and personalized invitations require the Supabase setup below. Restart the development server after changing environment values.

| Variable | Configuration |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Canonical origin used for metadata and every generated invitation link. Development example: `http://localhost:3000`. Production requires an explicitly configured HTTPS origin, such as `https://wedding.example.com`. No path, query, fragment, or embedded credentials. |
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project's HTTPS API origin, without a path, credentials, query, or fragment. HTTP loopback origins are accepted only in development/tests. |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Project publishable key used with the administrator's authenticated session and RLS. This is public configuration, not the server secret. |
| `SUPABASE_SECRET_KEY` | Server-only Supabase secret (`sb_secret_...`) or legacy service-role key. Used only by the public invitation resolver. Never prefix it with `NEXT_PUBLIC_` or put it in browser code. |

The canonical origin comes from configuration, never the request's Host header. HTTP is allowed only for local development origins. **`npm run build` runs in production mode and requires a valid HTTPS `NEXT_PUBLIC_SITE_URL`**, even when building on your laptop. After configuring the intended origin and project values:

```bash
npm run build
npm start
```

Generated links will point to that configured origin, not automatically to the local server. Public environment variables are embedded at build time; rebuild/redeploy after changing them. Keep `.env.local` and actual secrets out of source control, screenshots, logs, and documentation. `.env.example` contains configuration placeholders only.

## Invitation And Artwork

The current requirement is an HTML/SVG invitation, not a static full-image card with a guest-name overlay. Keep **`public/images/wedding-invitation.png`** unchanged as the original design reference and the unpersonalized artwork linked by the JavaScript-disabled fallback. It is not required for the interactive invitation to render. No generated test fixture belongs at the production artwork path.

`src/components/wedding/WeddingInvitation.tsx` composes semantic headings and invitation text with `PersonalizedGuest`, `WeddingCouple`, `WeddingDate`, `WeddingVenue`, and `WeddingRSVP`. Names are real text in a centered, wrapping guest line, not positioned over printed pixels. Card layout and responsive typography live in `src/components/wedding/card.css`.

| Asset | Purpose |
| --- | --- |
| `public/images/wedding-couple.webp` | Real couple crop, served as `/images/wedding-couple.webp` at its 246 x 374 aspect ratio. |
| `src/lib/mandala-artwork.json` | SVG view box and path data rendered by `AnimatedMandala`; not a full-card background image. |
| `public/images/great-vibes-latin.woff2` | Local script font used for invitation typography. |
| `public/images/wedding-invitation.png` | Original 1056 x 1490 reference and unpersonalized fallback. |

`InvitationExperience` runs the **welcome -> envelope -> invitation** journey. `WelcomeScene` presents the couple, date, guest greeting, and **Open My Invitation**. `EnvelopeScene` animates separate paper, seal, flap, and letter layers, with an intermediate opening state before displaying the final invitation. The letter contains the same HTML/SVG `WeddingInvitation`, not the original PNG. `experience.css` controls scene layout, and `src/components/animation/motionVariants.ts` contains shared motion variants.

`src/lib/wedding-config.ts` holds the couple, date, venue, directions, and contact details. Update the components, configuration, or supplied assets as appropriate, verify the design across viewport sizes, and redeploy. Replacing the reference PNG alone does not update the HTML invitation. Presentation-only changes need **no database change or token regeneration**; existing guest records and links remain valid. Check short, long, family, and international names, image proportions, the SVG mandala, font loading, and the envelope-to-card transition on desktop and mobile.

## Supabase Setup

1. Create or select the intended Supabase project. Use a separate test project for verification. In the trusted SQL editor, apply `supabase/migrations/202610270001_admin_invitations.sql`, then `supabase/migrations/202610270002_reserve_invitation_tokens.sql`, as the database owner. Alternatively, link the correct project with the Supabase CLI and run `supabase db push`; verify the project reference first. The migrations create `admin_users`, `invitations`, membership checks, constraints, indexes, timestamps, RLS, and a private registry preventing token reuse. If the first migration was already applied, apply only the second. Never replay an applied migration.
2. In Supabase Authentication, create an administrator with an email and a strong, unique password. Copy that **Auth user's UUID**, not an email, project ID, or invitation ID. The Auth user must exist before the allowlist insert because of the foreign key.
3. Run the following only through the trusted SQL editor/database-owner connection, replacing the placeholder with the actual UUID:

```sql
insert into public.admin_users (user_id)
values ('REPLACE-WITH-AUTH-USER-UUID');
```

4. Disable public sign-ups in Supabase Auth for this invitation-only deployment. Configure the Auth site URL and any allowed redirect URLs for your canonical domain as appropriate; this app's login itself uses email/password, not an OAuth callback. Configure production Auth/email settings and rate limits. There are no public signup, password-reset, or membership-management screens in this application.
5. Set the four environment values above to the same Supabase project. Keep the `private` schema out of the Data API's exposed schemas. Do not loosen grants or add an anonymous invitation SELECT policy to make public links work.
6. Sign in at `/admin/login`, then complete the live checklist below before sharing invitations.

To revoke an administrator, remove their allowlist row through a trusted owner connection:

```sql
delete from public.admin_users
where user_id = 'REPLACE-WITH-AUTH-USER-UUID';
```

Even an administrator cannot manage memberships from the app. MFA is optional future hardening, **not implemented or enforced by this application's login flow**; do not claim MFA protection without implementing and testing enrollment, challenge, and assurance checks. The current UI also has no CAPTCHA challenge, so enabling a provider CAPTCHA requirement alone is not a complete integration. See `supabase/SETUP.md` for additional setup and security details.

## Routes And Operations

| Route | Behavior |
| --- | --- |
| `/` | Public welcome page with links to the generic preview and `/admin` guest management (redirects to login when unauthorized). |
| `/preview` | Public, generic welcome -> envelope -> invitation journey greeting `Dear family & friends`; no guest lookup or guest-name query parameter. Marked noindex. |
| `/invite/[token]` | Public bearer-link lookup for one active invitation, then the welcome -> envelope -> personalized HTML/SVG invitation journey. Invalid, unknown, regenerated, and inactive tokens produce the unavailable/not-found page. Service failures use the generic retry error boundary. |
| `/admin/login` | Email/password sign-in, followed by verified-user and allowlist checks. A valid non-admin account is not granted access. |
| `/admin` | Protected dashboard with all/active/inactive totals and an invitation-creation form. |
| `/admin/guests` | Protected guest list, creation form, display-name search (`q`), and pagination (`page`), 25 records per page including inactive invitations. Row controls edit details, copy/open/preview links, regenerate, deactivate, and reactivate. |
| `/robots.txt` | Crawler rules disallow `/invite/`, `/admin`, and `/preview`. |
| `/opengraph-image` | Generic social image, not personalized invitation artwork or guest data. |
| `/images/wedding-invitation.png` | Original reference/fallback artwork; publicly accessible and not a private guest record. |

Creation is available on both admin pages. Enter an internal guest name, an optional title preset (`Mr.`, `Mrs.`, `Ms.`, `Dr.`, `Mr. & Mrs.`, or `Family`), and the exact display name to appear on the invitation. The display name initially follows title plus guest name but can be customized independently or reset with **Use title and guest name**. Names are trimmed, single-line text of at most 160 characters; control characters, line separators, and bidirectional override/isolate controls are rejected.

Choose an automatic random token (recommended) or a custom token. Custom tokens are trimmed, lowercased, and have whitespace converted to hyphens; the result must contain 8-128 ASCII letters, digits, hyphens, or underscores. Duplicates are rejected. Automatic tokens contain 192 bits of cryptographic randomness and are 32 URL-safe characters. Public token lookup is exact and case-sensitive; it does not normalize incoming links.

Successful creation immediately shows the guest's display name and canonical URL with **Copy link**, **Open**, and **Preview**, independently of the list's current search or page. Clipboard failure leaves the visible URL available for manual copying. In the guest list, expand **Edit guest details** and save to update names/title without changing the link. There is no delete operation.

- **Open** opens the canonical personalized URL in a new tab.
- **Preview** opens that same URL with `?preview=1`, skips straight to the HTML/SVG invitation, and does not change the session's already-opened state. It does not bypass active-token validation or grant access to inactive invitations. **Replay Envelope** still works in preview. Use `/preview` for the generic, database-independent demonstration starting at the welcome scene.
- **Regenerate link** asks for confirmation, replaces the token with a fresh random token, and invalidates the old URL on subsequent requests. The private token registry permanently reserves all issued tokens so an old URL cannot later be assigned to another guest. Copy and share the new link. Regeneration does not reactivate an inactive invitation. Tokens retired before the second migration cannot be recovered from existing rows.
- **Deactivate** asks for confirmation and makes the existing URL unavailable on subsequent requests. **Reactivate** restores the current token's availability. Neither can erase content already viewed or saved by a guest.
- **Sign out** ends the local Auth session and returns to login, even after admin membership is revoked. The access-denied login screen also offers this control.

The experience preloads the couple crop and supports **Skip Animation** from welcome or envelope, reduced-motion preferences, a session-scoped already-opened state, **Replay Envelope**, **Get Directions**, and contact links. Reduced motion and previously opened invitations bypass the introductory scenes. Actions below the card reveal as they enter the viewport. JavaScript is required for the interactive experience and personalized invitation; the noscript fallback links to the unpersonalized original artwork only. Rendering does not wait for the full original PNG to load or decode.

## Security And Operations

- Protected loaders and invitation mutation server actions call `requireAdmin()`, which verifies the Supabase user with `auth.getUser()` and checks their allowlist membership. Login authenticates before checking membership. Signing out clears only the caller's own session and does not require administrator membership. Hidden fields and client UI are not trusted authorization boundaries.
- Admin queries and writes use the publishable key plus the user's session, **not** the privileged secret. Database RLS permits allowlisted administrators to select, insert, and update invitations; anonymous users have no table grants or SELECT policy, and non-admin authenticated users cannot access invitation rows. App users cannot write memberships or delete invitations.
- Only `src/lib/invitations.ts`, marked `server-only`, uses `SUPABASE_SECRET_KEY`. It selects **only `display_name`**, filtered by the exact validated token and `is_active = true`, and returns no guest list or other record fields. This privileged key can bypass RLS; the token-only, active-only restriction is application code, not a claim that the key itself is limited to one row or SELECT-only capabilities. Never reuse it for admin mutations.
- Invitation pages are dynamic with revalidation disabled; the resolver and Supabase fetches bypass caching. Invitation/admin responses request `private, no-store` and send noindex headers/metadata. Do not add CDN page caching, cached database lookups, service-worker storage, or analytics that capture personalized pages. Generic static artwork may be cached independently.
- `robots.txt` and noindex directives discourage indexing but are not access controls. Links are bearer credentials: anyone who receives one can view it. Short or human-readable custom tokens are guessable and unsuitable as meaningful secrets. Prefer automatic tokens; avoid guest names or personal information in custom URLs. Avoid recording full invitation URLs in host logs, monitoring, analytics, screenshots, or support tickets. Global `Referrer-Policy: no-referrer` helps prevent URL leakage to external destinations.
- `src/proxy.ts` refreshes admin Auth cookies and propagates Supabase SSR cache headers. It is not the authorization boundary. Session cookies are HTTP-only, SameSite Lax, and secure in production. Database/service errors exposed through actions are sanitized.
- Password attempts rely on **Supabase Auth's built-in rate limits**; this app implements no process-local limiter and no rate-limit webhook. There is no application webhook endpoint. Configure suitable Supabase Auth limits and add host/edge rate limiting for `/admin/login` and relevant action requests. **Also rate-limit `/invite/*` at the host/edge to deter token scanning, especially with custom tokens**; Auth login limits do not protect this unauthenticated route. Avoid rate-limit logs that expose tokens and allow for legitimate guest traffic. These host protections are deployment recommendations, not shipped app features.

## Vercel Deployment

1. Put the project in a private source repository without `.env.local`, real keys, or guest data, then import/link it in Vercel as a Next.js project. Select **Node.js 22.x** in project settings; keep `npm ci` as the install command and `npm run build` as the build command.
2. Apply both Supabase migrations to the exact production project and create/allowlist the production Auth administrator as described above. Vercel does not run database migrations for this application. Disable signup and configure Auth settings and abuse protections before launch.
3. Include the original reference/fallback PNG, real couple WebP crop, local font, SVG mandala data, and component CSS in the deployment. A successful build alone does not prove that the deployed HTML/SVG invitation and scene transitions render correctly.
4. Configure all four `.env.example` variables in Vercel's **Production** environment, including the canonical HTTPS custom domain and the matching Supabase project's URL, publishable key, and server-only secret. Use separate test data/projects for Preview deployments; set their environment deliberately rather than exposing production guests. A preview build also runs in production mode and requires HTTPS configuration.
5. Attach the canonical domain, deploy, and verify generated links, metadata, cookie behavior, headers, and redirects on that domain. Do not derive the canonical URL from an incoming Host header or silently use a temporary deployment URL. Configure host/edge rate limiting and ensure external caches do not override private/no-store responses.
6. Complete the live checklist on the deployed site before distributing links. Redeploy whenever build-time public environment values or artwork/CSS change.

When moving the deployment to another Vercel project/account, transfer or reconnect the source and domain, select Node 22 again, and re-enter the environment variables through the host's secure settings. If keeping the same Supabase project, keep its existing schema and data; do not replay the initial migration. If moving to a new Supabase project, apply migrations there, securely migrate invitation data if existing tokens must survive, create the new Auth admin, and allowlist its actual new UUID. An allowlist UUID from the old Auth project is not automatically valid in the new one. Update matching keys/URLs, deploy, and re-test. Changing the canonical domain also requires a deliberate redirect plan for already-shared links. Never commit/export secrets into this README or a public repository during a move.

## Testing

Run the mocked backend unit suite and static checks:

```bash
npm test
npm run lint
npm run typecheck
```

`tests/backend.test.ts` checks validation and names, token generation/normalization, login, verified-user/allowlist authorization on each mutation, token-preserving edits, deactivation, regeneration, duplicate links, public resolver selection and no-store behavior, and creation results independent of search/pagination. Supabase and Next.js dependencies are mocked. These tests do **not** establish real Auth, deployed RLS, or approved-artwork fidelity.

For database policy checks, use a **migrated local Supabase test database** with a trusted owner connection, not a production database:

```bash
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/tests/invitations_rls.sql
```

`DATABASE_URL` is a test-tool connection string, not an application environment variable. This assertion-based SQL script requires no pgTAP and rolls back its fixtures. It covers anonymous and non-admin denial, administrator operations, membership write denial and revocation, active/inactive lookup, and input constraints. It does not replace verification of the deployed app.

Browser E2E tooling is Playwright (`npm run test:e2e`). Install the target engines with:

```bash
npx playwright install chromium firefox webkit
```

On Linux, install Playwright's system dependencies using `npx playwright install-deps` when required (administrator privileges may be needed). `playwright.config.ts` runs desktop Chromium, desktop Firefox, mobile Chromium, and mobile WebKit against a local Next.js server and an isolated mock Supabase process on ports 3100 and 54329. It overrides the app's Supabase settings only for the test process and never writes guest data to a real project. Run:

```bash
npm run test:e2e
```

To run only the Chromium projects: `npm run test:e2e -- --project=desktop-chromium --project=mobile-chromium`.

`tests/e2e/invitation.spec.ts` covers welcome -> envelope -> invitation, layered flap/letter animation, keyboard skip/replay and focus, session persistence, reduced motion, preview isolation, centered/wrapping long names and title formats, distinct guests, no-store/noindex/generic metadata, invalid/revoked links, sanitized database failures, and unauthenticated admin redirects. It checks the real couple crop and SVG mandala while the full original PNG is unavailable, and captures scene screenshots. `tests/e2e/admin.spec.ts` exercises login denial and allowlisting, SSR cookies, automatic/custom creation, duplicate rejection, clipboard fallback, search, token-preserving edits, lifecycle confirmations, regenerated links, Open starting at welcome, preview opening the invitation directly, and sign-out. The mock service is a separate test process, not an application demo mode, public API, or production database. These describe test coverage, not a claim that the current suite has passed; they do not verify live Supabase authentication or visual fidelity.

### Live Manual Checklist

These **14 journeys are a verification plan, not a record of executed live tests**. Use a disposable migrated Supabase project with actual credentials and the actual approved artwork, then repeat the relevant launch checks on production. Record browser/device, expected versus actual results, and date without publishing tokens or guest data.

1. **Bootstrap and artwork:** configure the project and canonical HTTPS origin, build/deploy, open `/` and `/preview` on desktop and mobile, and compare the HTML/SVG invitation to the original design reference. Verify the real couple crop's proportions, SVG mandala, local font, responsive layout, and wrapping guest line. Confirm long/international names do not obscure the design.
2. **Anonymous protection:** in a fresh browser session, visit `/admin` and `/admin/guests` and confirm login redirection. Using only the publishable key, confirm anonymous API reads/writes cannot retrieve invitations or memberships; direct/forged mutation submissions must not write data.
3. **Login failure and non-admin:** test invalid credentials and a valid Auth user without an allowlist row. Confirm generic denial, no guest data, and no admin access. Verify disabled signup and Supabase Auth rate-limit settings without brute-forcing the service.
4. **Administrator session:** sign in as the allowlisted admin, confirm dashboard totals and protected navigation, refresh to exercise session cookies, and verify session/refresh failures do not grant access.
5. **Automatic creation:** create an invitation from `/admin`, confirm the suggested title/name and independently customized display name, immediate share result, random token, canonical URL, and updated totals. Confirm no secret key reaches browser assets or network responses.
6. **Custom creation and validation:** create from `/admin/guests`; verify normalization, duplicate rejection, allowed characters/lengths, title presets, and rejection of empty, multiline, control-character, and overlong names. Confirm failures are sanitized and do not create records.
7. **Search and pagination:** create enough disposable records for more than 25 rows, include inactive rows, search display names, clear the search, and move between pages. Create while viewing a nonmatching search or later page; the new share result must still appear immediately.
8. **Copy, open, and preview:** exercise all share controls after creation and in the list. Confirm clipboard success and denied-clipboard fallback. Open in a signed-out browser; verify `?preview=1` skips animation without persisting opened state, enforces the same active-token behavior, and `/preview` stays generic.
9. **Guest editing:** change guest name, title, and display name, save, and reopen the existing URL. Confirm the display updates and token is unchanged; verify invalid edits do not persist.
10. **Reveal and accessibility:** in Chromium and WebKit, check welcome, **Open My Invitation**, the layered envelope opening, final invitation, **Skip Animation** from welcome and envelope, reduced motion, repeat visits in the same session, **Replay Envelope**, keyboard focus/status, **Get Directions**, contact links, and narrow/landscape layouts. Scroll through the complete card and its actions. Exercise missing/slow couple-image or font loads, confirm a missing original PNG does not block the HTML/SVG card, and check the JavaScript-disabled original-artwork fallback without substituting production assets.
11. **Deactivation and reactivation:** cancel and confirm deactivation, then request the URL in a fresh session and confirm it is unavailable. Reactivate and confirm the same current URL works and dashboard/list status updates.
12. **Regeneration:** cancel and confirm regeneration, verify the old URL becomes unavailable and the new canonical URL works, then repeat on an inactive record. It must remain inactive until explicitly reactivated. Share only the final intended link.
13. **Revocation and sign-out:** remove an admin's allowlist row through trusted SQL while they are signed in. Confirm subsequent protected reads and writes are denied, including forged action attempts. Verify they can still sign out from the access-denied login screen. Restore only if intended, then test sign-out and back/refresh behavior. Verify non-admin/admin sessions cannot write memberships or delete invitations through the API.
14. **Failure and privacy controls:** in the disposable environment, exercise unknown/malformed tokens, missing configuration, and database/network outages; confirm generic not-found/retry states with no sensitive errors. Inspect deployed no-store/noindex/referrer headers, robots rules, generic social metadata, server-only secret handling, log redaction, and host rate limits for login and `/invite/*`. Restore configuration and confirm recovery.

Current scene verification on 27 October 2026: **78 backend/configuration tests and 72 browser tests passed**, together with lint, TypeScript checks, and a Node 22 production build using the configured HTTPS deployment origin. Browser projects covered desktop Chromium, desktop Firefox, Pixel 7-sized Chromium, and iPhone 13-sized WebKit. Coverage includes the real opening sequence, cancellation/replay, hydration errors, distinct personalized guests, 320px and landscape layouts, printed content/date arrangement, and the complete mocked admin journey. Screenshots were also inspected against the original design reference; this is not a pixel-identical reproduction of printed typography.

This Linux host needed a temporary external WebKit launcher with a locally extracted codec-parser library and system GIO modules rather than inherited VS Code Snap modules. No host-specific paths or workarounds are embedded in the app or checked-in browser configuration. On other Linux hosts, install the standard Playwright system dependencies above. Physical Android/iPhone devices and WhatsApp in-app browsers still require manual testing before launch.

Historical database verification exercised both migrations and expanded RLS/token-reservation assertions in disposable PostgreSQL 17 with Supabase role/auth stand-ins, not the hosted project. Live Supabase authentication, deployed policies, and domain-level launch checks remain unverified without real project credentials.

## File Map

| Path | Responsibility |
| --- | --- |
| `src/app/` | App Router pages, layouts, error/loading/not-found UI, metadata, robots, and global styles. |
| `src/app/admin/actions.ts` | Validated authentication and invitation mutation server actions. |
| `src/app/admin/(protected)/` | Authorized dashboard and paginated/searchable guest list. |
| `src/app/invite/[token]/` | Dynamic public token page and unavailable/loading states. |
| `src/components/wedding/InvitationExperience.tsx` | Scene lifecycle, reduced motion, skip/replay, session state, focus/status, and original-artwork noscript fallback. |
| `src/components/wedding/WelcomeScene.tsx`, `EnvelopeScene.tsx`, `EnvelopeFlap.tsx` | Personalized welcome and layered envelope/letter opening. |
| `src/components/wedding/WeddingInvitation.tsx`, `PersonalizedGuest.tsx`, `WeddingCouple.tsx`, `WeddingDate.tsx`, `WeddingVenue.tsx`, `WeddingRSVP.tsx` | HTML/SVG card, wrapping guest-name line, couple crop, and invitation details. |
| `src/components/wedding/AnimatedMandala.tsx`, `WeddingActions.tsx`, `card.css`, `experience.css` | SVG decoration, directions/contact/replay actions, responsive card and scene styling. |
| `src/components/animation/motionVariants.ts`, `src/lib/wedding-config.ts`, `src/lib/mandala-artwork.json` | Shared motion variants, wedding details, and SVG mandala data. |
| `src/components/admin/` | Guest forms, link sharing, operations, login, and sign-out UI. |
| `src/lib/auth.ts`, `src/lib/admin-data.ts`, `src/lib/supabase/` | Verified admin checks, authenticated queries, and server-side Supabase clients/configuration. |
| `src/lib/invitations.ts` | Server-only exact-active-token public resolver. |
| `src/lib/validation.ts`, `tokens.ts`, `site.ts` | Shared schemas, cryptographic token generation, canonical-origin validation and URL creation. |
| `src/proxy.ts`, `next.config.ts` | Admin session refresh, cache/privacy and security headers. |
| `public/images/` | Original reference/fallback PNG, real couple WebP crop, and local script font. |
| `supabase/migrations/`, `supabase/SETUP.md`, `supabase/tests/` | Database schema/RLS, operator setup, and rollback-based SQL checks. |
| `tests/backend.test.ts`, `tests/config.test.ts` | Mocked backend and transport-configuration unit tests. |
| `playwright.config.ts`, `tests/e2e/`, `tests/mock-supabase.mjs` | Browser projects, fixture-backed UI coverage, and isolated test lookup service. |
| `.env.example`, `.nvmrc`, `package.json`, `package-lock.json` | Configuration template, Node 22 selection, npm scripts, and reproducible dependency installation. |
