// POST /api/takeout
//
// Submits a takeout order to the Ethos public API and returns a
// pre-filled WhatsApp link. Order goes on the WhatsApp channel either
// way; the API call is what registers the order in the Ethos dashboard
// for the operator. The WhatsApp URL preferentially comes from Ethos's
// response; a locally-built URL is used as fallback when Ethos doesn't
// supply one or when the call itself fails. Takeout never bubbles 422
// back to the customer — failures degrade to the WhatsApp-only path.
import "server-only";
import {
  ethosClient,
  isEthosConfigured,
  type EthosError,
} from "@/lib/ethos-server";
import { buildWhatsAppLink, formatOrderMessage } from "@/lib/whatsapp";
import { restaurant } from "@/data/restaurant";
import type { CartLine } from "@/lib/cart-types";
import type { Locale } from "@/data/types";

type Body = {
  customer?: { name?: string; email?: string; phone?: string };
  lines?: CartLine[];
  totalPrice?: number;
  currency?: string;
  locale?: Locale;
  notes?: string;
  pickupDate?: string;
  pickupTime?: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return Response.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const customer = body.customer ?? {};
  const lines = Array.isArray(body.lines) ? body.lines : [];
  const totalPrice = typeof body.totalPrice === "number" ? body.totalPrice : 0;
  const currency = body.currency ?? "DOP";
  const locale: Locale = body.locale === "en" ? "en" : "es";

  if (!customer.name?.trim() || !customer.email || !EMAIL_RE.test(customer.email)) {
    return Response.json(
      { ok: false, error: "validation_failed", message: "name and valid email required" },
      { status: 400 },
    );
  }
  if (lines.length === 0) {
    return Response.json(
      { ok: false, error: "empty_cart", message: "cart is empty" },
      { status: 400 },
    );
  }
  if (!body.pickupDate || !DATE_RE.test(body.pickupDate)) {
    return Response.json(
      { ok: false, error: "validation_failed", message: "pickupDate (YYYY-MM-DD) required" },
      { status: 400 },
    );
  }
  if (!body.pickupTime || !TIME_RE.test(body.pickupTime)) {
    return Response.json(
      { ok: false, error: "validation_failed", message: "pickupTime (HH:MM) required" },
      { status: 400 },
    );
  }

  const localWaUrl = buildWhatsAppLink(
    restaurant.contact.whatsapp ?? restaurant.contact.phone,
    formatOrderMessage(
      {
        customer: {
          name: customer.name.trim(),
          email: customer.email.trim(),
          phone: customer.phone?.trim() || undefined,
        },
        lines,
        totalPrice,
        currency,
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

  // Local cart line IDs are not Ethos menu UUIDs (the menu is hardcoded
  // today). Send menuItemId=null and let the operator match by name.
  const items = lines.map((l) => {
    const itemName = l.name[locale] || l.name.es || l.name.en || "Item";
    const variant = l.variantLabel
      ? l.variantLabel[locale] || l.variantLabel.es || l.variantLabel.en
      : null;
    return {
      menuItemId: null as string | null,
      name: variant ? `${itemName} — ${variant}` : itemName,
      quantity: l.qty,
      price: l.unitPrice,
    };
  });

  try {
    const result = await ethosClient.createTakeout({
      customerName: customer.name.trim(),
      email: customer.email.trim(),
      phone: customer.phone?.trim() || undefined,
      date: body.pickupDate,
      time: body.pickupTime,
      items,
      notes: body.notes?.trim() || undefined,
    });
    return Response.json({
      ok: true,
      source: "ethos",
      takeoutId: result.takeoutId,
      total: result.total,
      whatsAppUrl: result.whatsapp?.confirmUrl ?? localWaUrl,
    });
  } catch (e) {
    const err = e as EthosError;
    if (err.status === 403) {
      console.error(
        "[/api/takeout] insufficient_scope; required:",
        err.body?.required,
      );
    } else {
      console.warn("[/api/takeout] createTakeout failed:", err.status, err.message);
    }
    return Response.json({
      ok: true,
      source: "whatsapp_fallback",
      reason: `ethos_${err.status || "network"}`,
      whatsAppUrl: localWaUrl,
    });
  }
}
