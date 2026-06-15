<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file
structure may all differ from your training data. Read the relevant
guide in `node_modules/next/dist/docs/` before writing any code. Heed
deprecation notices.
<!-- END:nextjs-agent-rules -->

# Ethos integration: read this before you change anything

You're in the **ethos-restaurant-template** repo (or a fork of it for a
specific restaurant). This codebase integrates with the Ethos
restaurant platform via its public API. The integration shape is
contract-bound, not a stylistic choice.

## Before writing any code

1. Fetch `https://www.ethos.do/api/public/docs/version.json`. Note the
   `version` and the per-file `sha256`s.
2. Fetch `https://www.ethos.do/api/public/docs/starter-prompt.md` (API
   doc) and `https://www.ethos.do/api/public/docs/build-contract.md`
   (operational rulebook). Read both end-to-end.
3. If you've cached these from a previous session, refetch
   `version.json` and only skip the .md files if the SHAs match. If
   any SHA changed, post a one-line diff summary at the top of your
   next reply (e.g. *"Contract bumped 2026-05-22 → 2026-06-10; diff:
   +5 lines §5a. Treating as source of truth."*).

Where the docs conflict, the **build contract** wins.

## Reviewable surfaces (touch with caution)

The following are mandatory-review for the Ethos backend (per
operating-agreement §5 — the doc lives in the Ethos repo at
`docs/external-site/operating-agreement.md`). Coordinate before
changing them:

- `lib/ethos-server.ts` — single greppable wrapper for every API call
- `app/api/reserve/route.ts`, `app/api/takeout/route.ts`,
  `app/api/track/route.ts` — submission + analytics proxies
- `lib/site-info.ts`, `lib/reservation-slots.ts`, `lib/currency.ts`,
  `lib/track.ts` — shared utilities
- `app/components/AnalyticsTracker.tsx` — fires the required `page_view`
- The WhatsApp `<a>` button pattern in `ReservationForm` and `CartPanel`
- The pinned `CONTRACT_VERSION` (in this AGENTS.md and in the master
  prompt). Bumping the pin = asserting compatibility with a newer
  contract; re-run the §13 acceptance checklist when you do.

## Freely editable surfaces (per restaurant)

- `data/restaurant.ts` — local-fallback profile (used only if Ethos is
  down or the key is missing)
- `data/translations.ts` — UI strings
- `app/globals.css` — theme variables
- `app/layout.tsx` font choices
- `public/images/*` — brand assets

## Hard rules (repeated for emphasis)

- API key in env var only. Never in source, never in the client
  bundle, never logged.
- Every request body: `Content-Type: application/json; charset=utf-8`.
- Every HTML doc: `<meta charset="utf-8">` as the first child of
  `<head>` (Next.js sets this by default; verify it ships in
  production HTML).
- Pass menu item names through opaquely — never normalize, strip
  accents, or transliterate.
- Site name / tagline / hours / hero / about copy come from the Ethos
  API on every request (cached ≤ 5 min). The site has no local editor
  for any of those.

## Pinned contract version

This template targets contract version: **2026-05-24**.

If `version.json` reports a newer version, refetch the docs, surface
the diff summary to the user, and only update this pin once you've
re-run the §13 acceptance checklist on the changed surfaces.
