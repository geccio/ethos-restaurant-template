"use client";

import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "./LanguageProvider";
import { t } from "@/data/translations";
import { trackEvent } from "@/lib/track";
import { WhatsAppIcon } from "./WhatsAppIcon";
import {
  buildSlots,
  filterByLeadTime,
  toLocalDateISO,
  type ReservationSettings,
} from "@/lib/reservation-slots";
import type { Locale } from "@/data/types";

type SubmitResponse = {
  ok: boolean;
  source?: "ethos" | "whatsapp_fallback";
  whatsAppUrl?: string;
  reservationId?: string;
  error?: string;
  message?: string;
};

// Settings come from /api/public/site-info.reservationSettings via the
// server-rendered /reserve page. The form derives its available time
// slots, lead-time gating, and party-size cap from this single source —
// per build contract §5a, no constants in the form itself.
export function ReservationForm({ settings }: { settings: ReservationSettings }) {
  const { tr, locale } = useLanguage();
  const today = toLocalDateISO(new Date());

  const allSlots = useMemo(() => buildSlots(settings), [settings]);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [partySize, setPartySize] = useState(2);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [whatsAppUrl, setWhatsAppUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Available slots depend on the chosen date (lead-time gating only
  // bites for "today"). Recompute when date changes.
  // Lead-time filter only kicks in once a date is explicitly chosen.
  // Otherwise we show every operating slot so the picker isn't empty
  // before the user has done anything.
  const availableSlots = useMemo(
    () => filterByLeadTime(allSlots, date, settings),
    [allSlots, date, settings],
  );

  // If the selected time vanishes from the available list (e.g. user
  // switched from tomorrow back to today and their old slot is now
  // before the lead-time cutoff), reset to the first available.
  useEffect(() => {
    if (time && !availableSlots.includes(time)) {
      setTime(availableSlots[0] ?? "");
    } else if (!time && availableSlots.length > 0) {
      setTime(pickSensibleDefault(availableSlots));
    }
  }, [availableSlots, time]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!time) {
      setErrorMessage(tr(t.errorGeneric));
      return;
    }
    setSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/reserve", {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim() || undefined,
          partySize,
          date,
          time,
          notes: notes.trim() || undefined,
          locale,
        }),
      });
      const data = (await res.json()) as SubmitResponse;

      if (data.ok) {
        if (data.reservationId) {
          trackEvent("reservation_submitted", {
            reservationId: data.reservationId,
            party: partySize,
            date,
            time,
          });
        }
        // Build contract §9: WhatsApp button is a real <a> on the
        // success screen, not a programmatic window.open.
        setWhatsAppUrl(data.whatsAppUrl ?? null);
        setConfirmed(true);
      } else if (data.error === "not_accepting") {
        // 409 — site suspended.
        setErrorMessage(tr(t.notAcceptingReservations));
      } else if (data.error === "validation_failed") {
        // 422 — server-side capacity / lead-time / hours rejection.
        setErrorMessage(data.message ?? tr(t.errorGeneric));
      } else if (data.error === "service_unavailable") {
        // 503 — Ethos backend transiently down. Encourage retry.
        setErrorMessage(
          locale === "es"
            ? "El servicio está temporalmente fuera. Intenta de nuevo en unos minutos."
            : "The service is temporarily down. Please try again in a few minutes.",
        );
      } else {
        // 400 / 401 / 403 / 404 / 413 / 429 / 5xx / network — generic
        // per build contract §5c. Never leak auth/scope details.
        setErrorMessage(tr(t.errorGeneric));
      }
    } catch {
      setErrorMessage(tr(t.errorGeneric));
    } finally {
      setSubmitting(false);
    }
  };

  if (confirmed) {
    return (
      <div className="text-center py-16">
        <p className="text-accent text-xs uppercase tracking-[0.4em] mb-4">
          ✓
        </p>
        <h2 className="font-display text-4xl mb-4">
          {tr(t.reservationConfirmed)}
        </h2>
        <p className="text-foreground-muted mb-8 max-w-md mx-auto leading-relaxed">
          {tr(t.reservationReceived)}
        </p>
        {whatsAppUrl && (
          <a
            href={whatsAppUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() =>
              trackEvent("cta_click", { cta: "whatsapp_confirm_reservation" })
            }
            className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-[#25D366] text-white font-medium uppercase tracking-[0.18em] text-sm rounded-full hover:bg-[#1ebe57] transition-colors"
          >
            <WhatsAppIcon />
            {tr(t.confirmReservationByWhatsApp)}
          </a>
        )}
      </div>
    );
  }

  const inputClass =
    "w-full bg-background-elevated border border-border rounded-md px-4 py-3 text-foreground placeholder-foreground-muted/60 focus:outline-none focus:border-accent transition-colors";
  const labelClass =
    "text-xs uppercase tracking-[0.2em] text-foreground-muted mb-2 block";

  const noSlotsForToday =
    date && date === today && availableSlots.length === 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className={labelClass} htmlFor="name">
          {tr(t.fieldName)}
        </label>
        <input
          id="name"
          type="text"
          required
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass} htmlFor="email">
          {tr(t.fieldEmail)}
        </label>
        <input
          id="email"
          type="email"
          required
          autoComplete="email"
          inputMode="email"
          placeholder="tucorreo@ejemplo.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass} htmlFor="phone">
          {tr(t.fieldPhone)}
        </label>
        <input
          id="phone"
          type="tel"
          autoComplete="tel"
          inputMode="tel"
          placeholder="+1 (809) 000-0000"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass} htmlFor="party">
            {tr(t.fieldPartySize)}
          </label>
          <input
            id="party"
            type="number"
            min={1}
            max={settings.maxPartySize}
            required
            value={partySize}
            onChange={(e) =>
              setPartySize(
                Math.min(
                  settings.maxPartySize,
                  Math.max(1, Number(e.target.value)),
                ),
              )
            }
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="date">
            {tr(t.fieldDate)}
          </label>
          <input
            id="date"
            type="date"
            required
            min={today}
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label className={labelClass} htmlFor="time">
          {tr(t.fieldTime)}
        </label>
        <select
          id="time"
          required
          aria-label={tr(t.fieldTime)}
          value={time}
          onChange={(e) => setTime(e.target.value)}
          disabled={availableSlots.length === 0}
          className={`${inputClass} disabled:opacity-60`}
        >
          {availableSlots.length === 0 ? (
            <option value="">—</option>
          ) : (
            availableSlots.map((slot) => (
              <option key={slot} value={slot}>
                {formatSlot(slot, locale)}
              </option>
            ))
          )}
        </select>
        {noSlotsForToday && (
          <p className="mt-2 text-xs text-foreground-muted">
            {locale === "es"
              ? `Aviso: se requieren ${settings.leadHours}h de antelación. Elige otra fecha.`
              : `Heads up: ${settings.leadHours}h advance notice required. Pick another date.`}
          </p>
        )}
      </div>

      <div>
        <label className={labelClass} htmlFor="notes">
          {tr(t.fieldNotes)}
        </label>
        <textarea
          id="notes"
          rows={3}
          placeholder={tr(t.fieldNotesPlaceholder)}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className={inputClass}
        />
      </div>

      {errorMessage && (
        <p
          role="alert"
          className="text-sm text-red-300 bg-red-950/30 border border-red-900/50 rounded-md px-4 py-3"
        >
          {errorMessage}
        </p>
      )}

      <div className="pt-2">
        <button
          type="submit"
          disabled={submitting || availableSlots.length === 0 || !date}
          className="w-full sm:w-auto inline-flex items-center justify-center px-10 py-4 bg-accent text-background uppercase tracking-[0.2em] text-sm rounded-full hover:bg-foreground transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {submitting ? tr(t.submitting) : tr(t.sendRequest)}
        </button>
      </div>
    </form>
  );
}

// Render "HH:MM" 24h as a locale-appropriate label. Spanish uses 24h
// directly; English shows 12h with AM/PM.
function formatSlot(slot: string, locale: Locale): string {
  const [hStr, mStr] = slot.split(":");
  const h = parseInt(hStr, 10);
  const m = mStr;
  if (locale === "en") {
    const period = h >= 12 ? "PM" : "AM";
    const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${hour12}:${m} ${period}`;
  }
  return slot;
}

// Default to 7:00 PM (19:00) if that's available, otherwise the first
// slot — matches the prior form's "7 PM default" UX.
function pickSensibleDefault(slots: string[]): string {
  if (slots.includes("19:00")) return "19:00";
  if (slots.includes("19:30")) return "19:30";
  return slots[0] ?? "";
}
