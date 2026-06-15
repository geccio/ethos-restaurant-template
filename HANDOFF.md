<!-- ETHOS-CONTRACT-VERSION: 2026-05-24 -->
# Owner handoff template

Fill this out when you deploy a new restaurant site forked from this
template. The build contract (§15) requires a one-paragraph handoff for
the restaurant owner explaining where the key + base URL live, the
scopes the key needs, and how to verify the integration is live.

Replace the placeholders in `{{double-braces}}` per restaurant, then
commit the final version into the per-restaurant repo.

---

## Para el dueño del restaurante (Spanish — primary)

El sitio público de **{{Restaurant Name}}** vive en
**{{https://restaurant.example.com}}** y se conecta al backend de Ethos
(`https://www.ethos.do`) usando una API key. Toda la información que
aparece en el sitio — nombre, lema, horario, dirección, teléfono,
redes sociales, foto del hero, hasta los correos electrónicos — se
lee de tu dashboard de Ethos en cada visita (con caché de hasta 5
minutos). Editas en el dashboard, el sitio se actualiza solo.

**Qué necesitas mantener:**

- `ETHOS_API_KEY` y `ETHOS_BASE_URL` viven en las variables de entorno
  de Vercel (proyecto `{{vercel-project-name}}`, scope **Production**).
  La key empieza por `ethos_live_` y la creas en el dashboard de
  Ethos: **Mi Sitio Web → Crear clave nueva**. La key se muestra
  **una sola vez** — si la pierdes, generas otra; no se puede
  recuperar.
- La clave necesita estos scopes (o el comodín `*`):
  `site:read, menu:read, reservations:write, takeouts:write,
   customers:write, events:write`.
- Si rotas la clave: actualiza Vercel (`vercel env rm ETHOS_API_KEY
  production` + `vercel env add ETHOS_API_KEY production` con la
  nueva), luego redeploy.

**Cómo verificar que la integración está viva:**

1. `curl https://www.ethos.do/api/public/ping -H "Authorization: Bearer
   $ETHOS_API_KEY"` → debe responder `{"ok":true, ...}`.
2. Entra a **{{https://restaurant.example.com}}/reserve** y manda una
   reserva de prueba.
3. Abre el dashboard de Ethos en **Reservas** — la reserva debe
   aparecer en menos de 5 segundos.
4. En el dashboard de Ethos, ve a **Mi Sitio Web → Actividad** y
   confirma que ves un evento `reservation_submitted` reciente.

Si los pasos 3 o 4 fallan: la API key fue revocada, el plan está
suspendido, o el backend de Ethos está caído. El flujo del sitio
degrada solo a WhatsApp (el cliente nunca ve un error), así que el
negocio no se rompe — pero el dashboard se queda sin la fila.

## For the operator (English)

The public site for **{{Restaurant Name}}** at
**{{https://restaurant.example.com}}** reads its name, tagline, hours,
address, phone, socials, hero image, and contact email from the Ethos
dashboard at `https://www.ethos.do` on every request (cached up to
5 min).

**Required env vars** (Vercel project `{{vercel-project-name}}`, scope
Production):

| Variable | Value | Where it comes from |
|---|---|---|
| `ETHOS_API_KEY` | `ethos_live_<64 hex>` | Ethos dashboard → Mi Sitio Web → Crear clave nueva. Shown once. |
| `ETHOS_BASE_URL` | `https://www.ethos.do` | Canonical Ethos origin |

**Required scopes**: `site:read, menu:read, reservations:write,
takeouts:write, customers:write, events:write` — or wildcard `*`.

**Verify the integration is live**:

1. `GET /api/public/ping` returns `{"ok":true,...}`.
2. Submit a test reservation at `/reserve`.
3. Confirm the row appears in the Ethos Reservas tab within 5 s.
4. Confirm a `reservation_submitted` event appears in Mi Sitio Web →
   Actividad.

---

## §13 acceptance — rerun after every customization

Build contract §13 acceptance items. Verify before declaring the
restaurant's site done:

- [ ] `GET /api/public/ping` returns `ok:true` from the deployed
      server.
- [ ] The `/menu` page renders categories + items + photos pulled from
      `/api/public/menu` with NO local fallback strings showing.
- [ ] Submitting a reservation creates a row in the Ethos dashboard's
      Reservas tab within 5 s; shows the "Confirmar por WhatsApp"
      button; fires a `reservation_submitted` event.
- [ ] Submitting a takeout creates a row in Pedidos within 5 s;
      server's recomputed `total` matches the displayed total; shows
      the WhatsApp confirm button; fires a `takeout_submitted` event.
- [ ] Every page load fires a `page_view` event with the correct
      `payload.path`.
- [ ] Contact / newsletter form (if any) posts to
      `/api/public/customers` with a meaningful `source`.
- [ ] No occurrence of `ethos_live_` in the production client bundle:
      `grep -r ethos_live_ .next/static` is empty.
- [ ] Lighthouse mobile: Performance ≥ 80, Accessibility ≥ 95,
      SEO ≥ 95.
- [ ] 403 `insufficient_scope` and 401 `invalid_key` paths handled.

Stop here if any item fails. Investigate, fix, re-run.

---

## Code map

- `lib/ethos-server.ts` — single greppable server-only wrapper for
  every `/api/public/*` call.
- `lib/site-info.ts` — 5-min memoised cache over `/api/public/site-info`
  with fallback to `data/restaurant.ts`.
- `lib/reservation-slots.ts` — time slots from `reservationSettings`.
- `lib/currency.ts` — `Intl.NumberFormat` from `site-info.currency`.
- `lib/track.ts` (client) + `app/api/track/route.ts` (server) —
  fire-and-forget analytics proxy.
- `app/api/reserve` + `app/api/takeout` — submission handlers.
- `app/components/ReservationForm` + `app/components/CartPanel` —
  customer-facing forms with the WhatsApp `<a>` confirm pattern.
- `app/layout.tsx` — `generateMetadata` from site-info.
