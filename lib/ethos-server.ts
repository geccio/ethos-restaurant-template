// Server-only Ethos public-API client.
//
// Never import this from a Client Component or a browser-reachable
// module — the `server-only` import below will fail the build if you do.
// Route handlers under app/api/* are the right callsites.
import "server-only";

const BASE = process.env.ETHOS_BASE_URL?.replace(/\/+$/, "") ?? "";
const KEY = process.env.ETHOS_API_KEY ?? "";

const KEY_FORMAT = /^ethos_live_[0-9a-f]{64}$/;

export function isEthosConfigured(): boolean {
  return BASE.length > 0 && KEY_FORMAT.test(KEY);
}

export type EthosError = Error & {
  status: number;
  body: Record<string, unknown>;
};

async function ethos<T>(path: string, init?: RequestInit): Promise<T> {
  if (!isEthosConfigured()) {
    const err = new Error("not_configured") as EthosError;
    err.status = 0;
    err.body = { error: "not_configured" };
    throw err;
  }

  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${KEY}`,
      // Explicit charset per master prompt §"Restricciones duras" so
      // multi-byte payloads (Spanish accents, etc.) decode as UTF-8 on
      // every HTTP client, including legacy ones.
      "Content-Type": "application/json; charset=utf-8",
      ...(init?.headers ?? {}),
    },
    // POST + GET in a route handler — never cache identity-bearing calls.
    cache: "no-store",
  });

  const json = (await res
    .json()
    .catch(() => ({}))) as Record<string, unknown>;

  if (!res.ok || json.ok === false) {
    const err = new Error(String(json.error ?? res.statusText)) as EthosError;
    err.status = res.status;
    err.body = json;
    // On 429, honour either the response body's `retryAfter` (the API
    // spec's preferred shape) or the Retry-After HTTP header (the
    // platform fallback). Surface as a number on the error so callers
    // can back off without re-parsing.
    if (res.status === 429) {
      const headerRA = parseInt(res.headers.get("retry-after") ?? "", 10);
      const bodyRA = typeof json.retryAfter === "number" ? json.retryAfter : null;
      const retryAfter = bodyRA ?? (Number.isFinite(headerRA) ? headerRA : null);
      if (retryAfter !== null) {
        (err.body as Record<string, unknown>).retryAfter = retryAfter;
      }
    }
    throw err;
  }
  return json as T;
}

export type WhatsAppHandoff = {
  confirmUrl: string | null;
  ownerNotifyUrl: string | null;
} | null;

export type SiteInfo = {
  ok: true;
  siteId: string;
  slug: string;
  status: string;
  // Top-level fields (siblings of `info`, not nested). `currency` was
  // added 2026-05-22; `takeoutEnabled` lands in the upcoming Ethos PR
  // (operating agreement §2). Treat absent currency as "DOP" per the
  // build contract; absent takeoutEnabled as true (the v1 default).
  currency?: "DOP" | "USD" | "EUR" | string;
  takeoutEnabled?: boolean;
  contentVersion?: string;
  info: Record<string, unknown> & {
    name?: string;
    address?: string;
    phone?: string;
    tagline?: string;
    about?: string;
    heroImage?: string | null;
    aboutImage?: string | null;
    gallery?: string[];
    facebook?: string;
    instagram?: string;
    twitter?: string;
    contactEmail?: string;
    mapsEmbed?: string;
    reviews?: Array<Record<string, unknown>>;
    hours?: { weekdays?: string; weekend?: string; sunday?: string };
  };
  reservationSettings: {
    openTime?: string;
    closeTime?: string;
    durationMinutes?: number;
    capacity?: number;
    slotMinutes?: number;
    leadHours?: number;
    maxPartySize?: number;
  };
};

export type MenuResponse = {
  ok: true;
  categories: { id: string; name: string; order: number }[];
  items: {
    id: string;
    categoryId: string;
    name: string;
    description: string;
    price: number;
    status: "active" | "inactive";
    order: number;
    photo: string | null;
    availableFrom: string | null;
    availableTo: string | null;
    showItbis: boolean;
    displayStyle: "text" | "photo";
  }[];
};

export type ReservationRecord = {
  id: string;
  customerName: string;
  email: string;
  phone: string;
  date: string;
  time: string;
  party: number;
  notes: string;
  status: "confirmada" | "pendiente" | "cancelada";
  createdAt: string;
};

export type TakeoutRecord = {
  id: string;
  customerName: string;
  email: string;
  phone: string;
  date: string;
  time: string;
  items: Array<{
    menuItemId: string | null;
    name: string;
    quantity: number;
    price: number;
  }>;
  total: number;
  notes: string;
  status: "pendiente" | "preparando" | "listo" | "entregado" | "cancelado";
  createdAt: string;
};

export type CustomerRecord = {
  id: string;
  name: string;
  email: string;
  phone: string;
  lastVisit: string | null;
  totalVisits: number;
  notes: string;
  createdAt: string;
};

export type EventRecord = {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  sourceIp: string | null;
  createdAt: string;
};

export type CreateReservationInput = {
  customerName: string;
  email: string;
  phone?: string;
  date: string;
  time: string;
  party: number;
  notes?: string;
};

export type CreateTakeoutInput = {
  customerName: string;
  email?: string;
  phone?: string;
  date: string;
  time: string;
  items: Array<{
    menuItemId?: string | null;
    name: string;
    quantity: number;
    price: number;
  }>;
  notes?: string;
};

export type UpsertCustomerInput = {
  name: string;
  email: string;
  phone?: string;
  notes?: string;
  source?: string;
};

function buildQuery(params: Record<string, string | number | undefined>): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "") q.set(k, String(v));
  }
  const s = q.toString();
  return s ? `?${s}` : "";
}

export const ethosClient = {
  ping: () =>
    ethos<{ ok: true; siteId: string; slug: string; name: string | null }>(
      "/api/public/ping",
    ),

  getSiteInfo: () => ethos<SiteInfo>("/api/public/site-info"),

  getMenu: (opts?: { includeInactive?: boolean }) =>
    ethos<MenuResponse>(
      `/api/public/menu${opts?.includeInactive ? "?includeInactive=1" : ""}`,
    ),

  listReservations: (filters?: {
    status?: string;
    from?: string;
    to?: string;
    limit?: number;
  }) =>
    ethos<{ ok: true; reservations: ReservationRecord[] }>(
      `/api/public/reservations${buildQuery(filters ?? {})}`,
    ),

  createReservation: (input: CreateReservationInput) =>
    ethos<{
      ok: true;
      reservationId: string;
      whatsapp: WhatsAppHandoff;
    }>("/api/public/reservations", {
      method: "POST",
      body: JSON.stringify(input),
    }),

  listTakeouts: (filters?: {
    status?: string;
    from?: string;
    to?: string;
    limit?: number;
  }) =>
    ethos<{ ok: true; takeouts: TakeoutRecord[] }>(
      `/api/public/takeouts${buildQuery(filters ?? {})}`,
    ),

  createTakeout: (input: CreateTakeoutInput) =>
    ethos<{
      ok: true;
      takeoutId: string;
      total: number;
      whatsapp: WhatsAppHandoff;
    }>("/api/public/takeouts", {
      method: "POST",
      body: JSON.stringify(input),
    }),

  listCustomers: (filters?: { search?: string; limit?: number }) =>
    ethos<{ ok: true; customers: CustomerRecord[] }>(
      `/api/public/customers${buildQuery(filters ?? {})}`,
    ),

  upsertCustomer: (input: UpsertCustomerInput) =>
    ethos<{ ok: true; customerId: string }>("/api/public/customers", {
      method: "POST",
      body: JSON.stringify(input),
    }),

  listEvents: (filters?: {
    type?: string;
    from?: string;
    to?: string;
    limit?: number;
  }) =>
    ethos<{ ok: true; events: EventRecord[] }>(
      `/api/public/events${buildQuery(filters ?? {})}`,
    ),

  logEvent: (type: string, payload?: Record<string, unknown>) =>
    ethos<{ ok: true; eventId: string }>("/api/public/events", {
      method: "POST",
      body: JSON.stringify({ type, payload }),
    }),
};
