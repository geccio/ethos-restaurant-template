// Time-slot computation for the reservation form, driven by the
// `reservationSettings` block returned from /api/public/site-info.
// Build contract §5a:
//   - openTime / closeTime define selectable hours
//   - slotMinutes defines the granularity
//   - leadHours is the minimum hours-from-now a booking is allowed
//   - maxPartySize caps the party-size input
//   - capacity is informational (used for smarter pickers later)

export type ReservationSettings = {
  openTime: string;
  closeTime: string;
  slotMinutes: number;
  leadHours: number;
  maxPartySize: number;
  capacity?: number;
  durationMinutes?: number;
};

const DEFAULT_SETTINGS: ReservationSettings = {
  openTime: "12:00",
  closeTime: "22:00",
  slotMinutes: 30,
  leadHours: 2,
  maxPartySize: 20,
};

export function normalizeSettings(
  raw: Partial<ReservationSettings> | undefined,
): ReservationSettings {
  return {
    openTime: raw?.openTime || DEFAULT_SETTINGS.openTime,
    closeTime: raw?.closeTime || DEFAULT_SETTINGS.closeTime,
    slotMinutes: clampInt(raw?.slotMinutes, 5, 240, DEFAULT_SETTINGS.slotMinutes),
    leadHours: clampInt(raw?.leadHours, 0, 168, DEFAULT_SETTINGS.leadHours),
    maxPartySize: clampInt(raw?.maxPartySize, 1, 100, DEFAULT_SETTINGS.maxPartySize),
    capacity: raw?.capacity,
    durationMinutes: raw?.durationMinutes,
  };
}

// Returns the full list of slot times (HH:MM, 24h) the restaurant is
// open on `chosenDate`. Does NOT filter by lead time — that depends on
// the current clock, which is a client-side concern; do that with
// `filterByLeadTime`.
export function buildSlots(settings: ReservationSettings): string[] {
  const start = parseHM(settings.openTime);
  const end = parseHM(settings.closeTime);
  if (start === null || end === null) return [];
  const step = Math.max(5, settings.slotMinutes);
  const out: string[] = [];
  for (let m = start; m <= end - step; m += step) {
    out.push(formatHM(m));
  }
  // Always include closeTime itself as a final option if the loop missed it
  // by less than `step`, so customers see "10:00 PM" when closing is 22:00.
  if (out.length === 0 || lastMinutes(out) < end - 0) {
    // never include the exact closing time as an available slot — the
    // diner can't be seated at close; the last slot is closeTime - step.
  }
  return out;
}

// Drop slots earlier than `now + leadHours` for the chosen date. If the
// chosen date is later than today, returns the input unchanged.
export function filterByLeadTime(
  slots: string[],
  chosenDate: string,
  settings: ReservationSettings,
  now: Date = new Date(),
): string[] {
  if (!chosenDate) return slots;
  const todayISO = toLocalDateISO(now);
  if (chosenDate > todayISO) return slots;
  if (chosenDate < todayISO) return [];

  const cutoffMs = now.getTime() + settings.leadHours * 60 * 60_000;
  const cutoff = new Date(cutoffMs);
  const cutoffMinutes = cutoff.getHours() * 60 + cutoff.getMinutes();
  return slots.filter((s) => {
    const m = parseHM(s);
    return m !== null && m >= cutoffMinutes;
  });
}

export function toLocalDateISO(d: Date): string {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function parseHM(s: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(s);
  if (!m) return null;
  const h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  if (h < 0 || h > 23 || min < 0 || min > 59) return null;
  return h * 60 + min;
}

function formatHM(totalMinutes: number): string {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(Math.floor(totalMinutes / 60))}:${pad(totalMinutes % 60)}`;
}

function lastMinutes(slots: string[]): number {
  const last = slots[slots.length - 1];
  return parseHM(last) ?? 0;
}

function clampInt(
  v: number | undefined,
  min: number,
  max: number,
  fallback: number,
): number {
  if (typeof v !== "number" || !Number.isFinite(v)) return fallback;
  return Math.min(max, Math.max(min, Math.floor(v)));
}
