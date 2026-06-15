# Ethos restaurant template

A Next.js 16 (App Router, Turbopack) scaffold for customer-facing
restaurant websites that integrate with **Ethos** as their operational
backend. The wire-level integration plumbing — reservations, takeouts,
customers, analytics events, the WhatsApp confirm flow — is pre-wired
against the contract at https://www.ethos.do. Fork this, swap brand
assets, deploy.

> If you're an LLM/coding agent reading this: also read
> [`AGENTS.md`](./AGENTS.md). The Ethos build contract and API doc are
> fetchable at https://www.ethos.do/api/public/docs/ and they govern
> what you're allowed to change without coordination.

## What's in the box

- **Pre-wired integration** with `/api/public/*` for site profile,
  menu, reservations, takeouts, customers, and analytics events. The
  API key never leaves the server.
- **The three mandatory analytics events** — `page_view`,
  `reservation_submitted`, `takeout_submitted` — emitted via a
  server-side proxy at `/api/track`.
- **WhatsApp confirm-button pattern** (build contract §9) — a real
  `<a target="_blank" rel="noopener noreferrer">` button rendered on
  the success screen, never a programmatic `window.open`.
- **Reservation time picker driven by `reservationSettings`** — slots
  computed from `openTime` / `closeTime` / `slotMinutes` / `leadHours`
  / `maxPartySize`, refetched on every request.
- **Takeout cart** with item selection + pickup date/time fields.
  Sends the server-recomputed `total` as authoritative.
- **Bilingual UI scaffolding** (`es`, `en`) via `LanguageProvider` — UI
  labels are bilingual, content from Ethos is rendered in whichever
  language the dashboard ships.
- **Server-rendered metadata** (`<title>`, `<meta description>`,
  `og:image`) pulled from `/api/public/site-info` on every request.
- **Graceful degradation** to a hardcoded restaurant.ts when Ethos is
  unreachable. The site never serves a blank page.

## Quick start (per restaurant)

```bash
# 1. Click "Use this template" on GitHub and create a new repo for the
#    restaurant. Then locally:
git clone https://github.com/<your-org>/<restaurant-slug>.git
cd <restaurant-slug>
npm install

# 2. Tell the operator (or the Ethos staff) to issue an API key in the
#    dashboard: "Mi Sitio Web → Crear clave nueva" with the wildcard *
#    scope. The key is shown only once — paste it into a fresh
#    .env.local from .env.example:
cp .env.example .env.local
$EDITOR .env.local      # fill ETHOS_API_KEY and ETHOS_BASE_URL

# 3. Verify connectivity:
npm run dev
# in another shell:
curl http://localhost:3000/api/reserve -X POST \
  -H "Content-Type: application/json; charset=utf-8" \
  -d '{"name":"Test","email":"t@example.com","date":"2030-01-01","time":"19:30","partySize":2,"locale":"es"}'

# 4. Deploy to Vercel:
vercel link --yes
echo "$ETHOS_API_KEY" | vercel env add ETHOS_API_KEY production
echo "$ETHOS_BASE_URL" | vercel env add ETHOS_BASE_URL production
vercel deploy --prod
```

You should see `{"ok":true,"source":"ethos","reservationId":"..."}` in
the test reservation response, and the reservation should appear in
the Ethos dashboard's Reservas tab within 5 seconds.

## What to customize per restaurant

These are safe to edit freely:

| File | What it controls |
|---|---|
| `data/restaurant.ts` | Local-fallback name/contact/hours used only when Ethos is unreachable. Keep generic OR fill with real values as a belt-and-braces safety net. |
| `public/images/*.jpg` | Hero, food carousel, interior photos, landing-card images. Replace per-restaurant. Sizes documented in `scripts/generate-placeholders.mjs`. |
| `app/globals.css` | Theme (CSS variables for color palette). Default ships a muted dark theme; tweak `--color-bg`, `--color-fg`, `--color-accent`, etc. |
| `data/translations.ts` | UI strings. Add/remove translation keys as the brand requires. Keep the existing keys' shapes intact (the components reference them by name). |
| `app/layout.tsx` | Font choices. Replace `Geist` / `Cormorant_Garamond` with the brand's fonts if the restaurant has a typographic identity. |

## What NOT to customize per restaurant

These are contract-bound — changing them breaks the integration. Touch
them only as part of a coordinated update with the Ethos backend agent:

| File | Why it's locked |
|---|---|
| `lib/ethos-server.ts` | Single server-only wrapper for every `/api/public/*` call. Reviewable by the Ethos backend per operating-agreement §5. |
| `app/api/reserve/route.ts`, `app/api/takeout/route.ts`, `app/api/track/route.ts` | Submission + analytics proxies. Their wire shape matches the Ethos contract. |
| `lib/reservation-slots.ts`, `lib/site-info.ts`, `lib/currency.ts`, `lib/track.ts` | Shared utilities used by both forms and the layout. Stable shape matters. |
| `app/components/AnalyticsTracker.tsx` | Fires `page_view` on every route change. Required by build contract §8. |
| The `confirmReservationByWhatsApp` / `confirmOrderByWhatsApp` button pattern | Build contract §9 — must be a real anchor, must use `whatsapp.confirmUrl` from the server response. |
| `CONTRACT_VERSION` pinning (in the agent prompts) | The template targets a specific contract version. Bumping the pin = re-running the §13 acceptance against the new version. |

## Required env vars

| Variable | Example | Source |
|---|---|---|
| `ETHOS_API_KEY` | `ethos_live_<64 hex chars>` | Ethos dashboard → Mi Sitio Web → Crear clave nueva. Shown **once**. |
| `ETHOS_BASE_URL` | `https://www.ethos.do` | The canonical Ethos origin |

Optional:

| Variable | Default | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | (Vercel URL) | The site's canonical URL, used for `metadataBase` so `og:image` resolves absolute URLs. Set this on production for proper social-card previews. |

## Required key scopes

The API key needs (or the wildcard `*`):

```
site:read, menu:read,
reservations:write,
takeouts:write,
customers:write,
events:write
```

A narrower key returns 403 `insufficient_scope` from the corresponding
endpoint. The customer-facing flow degrades gracefully (WhatsApp
fallback), but the dashboard misses the row. Tell the operator to
widen the key in **Mi Sitio Web → Crear clave nueva** if you see those
in server logs.

## Project structure

```
app/
  api/
    reserve/route.ts        POST → /api/public/reservations
    takeout/route.ts        POST → /api/public/takeouts
    track/route.ts          POST → /api/public/events (analytics proxy)
  components/               Header, Footer, Hero, About, Location,
                            ReservationForm, CartPanel, AnalyticsTracker,
                            WhatsAppIcon, CartProvider, LanguageProvider
  layout.tsx                generateMetadata + Header/Footer mount
  page.tsx                  Home (Hero + Options + About + Location)
  menu/page.tsx             Menu listing (refactors to /api/public/menu)
  reserve/page.tsx          Reservation form
  takeout/page.tsx          Takeout cart + form
data/
  restaurant.ts             Local-fallback restaurant profile
  menu.ts                   Local-fallback menu (real menu = Ethos API)
  translations.ts           UI strings (bilingual)
  types.ts                  Local data types
lib/
  ethos-server.ts           Server-only API client (every call)
  site-info.ts              5-min memoised cache over site-info
  reservation-slots.ts      Slot computation from reservationSettings
  currency.ts               Intl.NumberFormat from site-info.currency
  track.ts                  Client-side fire-and-forget analytics helper
  whatsapp.ts               Local-fallback WhatsApp URL builder
  cart-types.ts             Cart line shape
public/
  images/                   Brand assets (replace per restaurant)
HANDOFF.md                  Owner handoff template (build contract §15)
```

## Reference docs

The Ethos contract is the source of truth and lives at:

- API wire doc: https://www.ethos.do/api/public/docs/starter-prompt.md
- Build contract: https://www.ethos.do/api/public/docs/build-contract.md
- Version manifest (SHA-256 per file): https://www.ethos.do/api/public/docs/version.json

Refetch `version.json` at the start of every editing session. If the
SHA changed, re-read both docs before writing code. See `AGENTS.md` for
the LLM/agent-specific rules.
