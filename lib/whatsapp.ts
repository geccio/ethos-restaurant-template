// WhatsApp link + message helpers. Pure functions, safe on client OR
// server. No secrets, no environment dependencies.
import type { Locale } from "@/data/types";
import type { CartLine } from "@/lib/cart-types";

export function buildWhatsAppLink(phoneE164: string, message: string): string {
  const cleaned = phoneE164.replace(/[^\d]/g, "");
  return `https://wa.me/${cleaned}?text=${encodeURIComponent(message)}`;
}

function formatPriceShort(value: number, currency: string): string {
  try {
    return new Intl.NumberFormat("es-DO", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `$${value.toLocaleString()}`;
  }
}

function format12h(time24h: string): string {
  const [hStr, mStr = "00"] = time24h.split(":");
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10) || 0;
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${m.toString().padStart(2, "0")} ${period}`;
}

export function formatReservationMessage(
  p: {
    name: string;
    email: string;
    phone?: string;
    partySize: number;
    date: string;
    time: string; // HH:MM (24h)
    notes?: string;
  },
  locale: Locale,
  restaurantName: string,
): string {
  const time12 = format12h(p.time);
  const labels =
    locale === "es"
      ? {
          intro: `Hola, quisiera reservar mesa en ${restaurantName}:`,
          name: "Nombre",
          email: "Email",
          phone: "Teléfono",
          party: "Personas",
          date: "Fecha",
          time: "Hora",
          notes: "Notas",
        }
      : {
          intro: `Hi, I'd like to reserve a table at ${restaurantName}:`,
          name: "Name",
          email: "Email",
          phone: "Phone",
          party: "Party",
          date: "Date",
          time: "Time",
          notes: "Notes",
        };
  const lines = [
    labels.intro,
    "",
    `${labels.name}: ${p.name}`,
    `${labels.email}: ${p.email}`,
  ];
  if (p.phone) lines.push(`${labels.phone}: ${p.phone}`);
  lines.push(
    `${labels.party}: ${p.partySize}`,
    `${labels.date}: ${p.date}`,
    `${labels.time}: ${time12}`,
  );
  if (p.notes) lines.push(`${labels.notes}: ${p.notes}`);
  return lines.join("\n");
}

export function formatOrderMessage(
  p: {
    customer: { name: string; email: string; phone?: string };
    lines: CartLine[];
    totalPrice: number;
    currency: string;
  },
  locale: Locale,
  restaurantName: string,
): string {
  const labels =
    locale === "es"
      ? {
          intro: `Hola, quisiera ordenar para llevar de ${restaurantName}:`,
          name: "Nombre",
          email: "Email",
          phone: "Teléfono",
          total: "Total",
        }
      : {
          intro: `Hi, I'd like to place a takeout order from ${restaurantName}:`,
          name: "Name",
          email: "Email",
          phone: "Phone",
          total: "Total",
        };
  const header = [
    labels.intro,
    "",
    `${labels.name}: ${p.customer.name}`,
    `${labels.email}: ${p.customer.email}`,
  ];
  if (p.customer.phone) header.push(`${labels.phone}: ${p.customer.phone}`);
  header.push("");

  const items = p.lines.map((l) => {
    const name = l.name[locale];
    const variant = l.variantLabel ? ` (${l.variantLabel[locale]})` : "";
    const unit = formatPriceShort(l.unitPrice, l.currency);
    return `• ${l.qty}× ${name}${variant} — ${unit}`;
  });

  return [
    ...header,
    ...items,
    "",
    `${labels.total}: ${formatPriceShort(p.totalPrice, p.currency)}`,
  ].join("\n");
}
