// POST /api/reserve
//
// Submits a reservation to the Ethos public API AND returns a
// pre-filled WhatsApp link — the client opens both, so the restaurant
// receives the request on both channels every time. The WhatsApp URL
// preferentially comes from Ethos's response (built from the restaurant's
// configured phone); a locally-built URL is used as fallback when Ethos
// doesn't supply one or when the Ethos call itself fails (401/429/5xx/
// network). 422 (validation rejected by Ethos) and 409 (site suspended)
// are bubbled up so the form can show the specific reason. 403
// (insufficient scope) is surfaced as a configuration problem.
import "server-only";
import {
  ethosClient,
  isEthosConfigured,
  type EthosError,
} from "@/lib/ethos-server";
import { buildWhatsAppLink, formatReservationMessage } from "@/lib/whatsapp";
import { restaurant } from "@/data/restaurant";
import type { Locale } from "@/data/types";

type Body = {
  name?: string;
  email?: string;
  phone?: string;
  partySize?: number;
  date?: string;
  time?: string;
  notes?: string;
  locale?: Locale;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

function validate(body: Body): { ok: true } | { ok: false; message: string } {
  if (!body.name || body.name.trim().length === 0)
    return { ok: false, message: "name required" };
  if (!body.email || !EMAIL_RE.test(body.email))
    return { ok: false, message: "valid email required" };
  if (!body.date || !DATE_RE.test(body.date))
    return { ok: false, message: "date must be YYYY-MM-DD" };
  if (!body.time || !TIME_RE.test(body.time))
    return { ok: false, message: "time must be HH:MM" };
  if (typeof body.partySize !== "number" || body.partySize < 1 || body.partySize > 100)
    return { ok: false, message: "partySize must be 1..100" };
  return { ok: true };
}

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return Response.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const v = validate(body);
  if (!v.ok) {
    return Response.json(
      { ok: false, error: "validation_failed", message: v.message },
      { status: 400 },
    );
  }

  const locale = body.locale === "en" ? "en" : "es";

  // Local fallback WhatsApp URL — used on any non-422 Ethos failure and
  // also when Ethos returns no whatsapp handoff (e.g. no phone configured).
  const localWaUrl = buildWhatsAppLink(
    restaurant.contact.whatsapp ?? restaurant.contact.phone,
    formatReservationMessage(
      {
        name: body.name!.trim(),
        email: body.email!.trim(),
        phone: body.phone?.trim() || undefined,
        partySize: body.partySize!,
        date: body.date!,
        time: body.time!,
        notes: body.notes?.trim() || undefined,
      },
      locale,
      restaurant.name,
    ),
  );

  if (!isEthosConfigured()) {
    return Response.json({
      ok: true,
      source: "whatsapp_fallback",
      reason: "not_configured",
      whatsAppUrl: localWaUrl,
    });
  }

  try {
    const result = await ethosClient.createReservation({
      customerName: body.name!.trim(),
      email: body.email!.trim(),
      phone: body.phone?.trim() || undefined,
      date: body.date!,
      time: body.time!,
      party: body.partySize!,
      notes: body.notes?.trim() || undefined,
    });
    return Response.json({
      ok: true,
      source: "ethos",
      reservationId: result.reservationId,
      whatsAppUrl: result.whatsapp?.confirmUrl ?? localWaUrl,
    });
  } catch (e) {
    const err = e as EthosError;
    // 422 / "invalid_slot" — validation. 409 — site suspended. 503 —
    // backend transiently out. All three are surfaced to the diner
    // with a recognisable error so they can act (different from the
    // 401/403/404/etc. failure cases, which silently fall back).
    if (err.status === 422 || err.status === 409 || err.status === 503) {
      const errorKey =
        err.status === 409
          ? "not_accepting"
          : err.status === 503
            ? "service_unavailable"
            : "validation_failed";
      return Response.json(
        {
          ok: false,
          error: errorKey,
          message: err.body?.message as string | undefined,
          issues: err.body?.issues,
        },
        { status: err.status },
      );
    }
    // Operator-side problems get logged but the customer flow proceeds
    // via WhatsApp regardless.
    if (err.status === 403) {
      console.error(
        "[/api/reserve] insufficient_scope; required:",
        err.body?.required,
      );
    } else if (err.status === 404) {
      console.error(
        "[/api/reserve] site not_found — has it been deleted?",
      );
    } else if (err.status === 429) {
      console.warn(
        "[/api/reserve] rate_limited; retryAfter=",
        err.body?.retryAfter,
      );
    } else if (err.status && err.status >= 500) {
      console.warn("[/api/reserve] ethos 5xx:", err.status, err.message);
    }
    // 400 / 401 / 403 / 404 / 413 / 429 / 5xx / network — fall back
    // silently to WhatsApp. Never leak auth/scope details to the diner.
    return Response.json({
      ok: true,
      source: "whatsapp_fallback",
      reason: `ethos_${err.status || "network"}`,
      whatsAppUrl: localWaUrl,
    });
  }
}
