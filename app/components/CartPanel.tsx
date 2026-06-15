"use client";

import { useEffect, useMemo, useState } from "react";
import { useCart } from "./CartProvider";
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

function formatPrice(value: number, currency: string) {
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

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type SubmitResponse = {
  ok: boolean;
  source?: "ethos" | "whatsapp_fallback";
  takeoutId?: string;
  total?: number;
  whatsAppUrl?: string;
  error?: string;
  message?: string;
};

type TakeoutResult = {
  whatsAppUrl: string | null;
  total: number;
};

function useTakeoutSubmit() {
  const { tr, locale } = useLanguage();
  const { lines, totalPrice, clear } = useCart();
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<TakeoutResult | null>(null);

  const submit = async (
    customer: { name: string; email: string; phone?: string },
    pickup: { date: string; time: string },
  ) => {
    if (lines.length === 0) return;
    setSubmitting(true);
    setErrorMessage(null);
    try {
      const res = await fetch("/api/takeout", {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify({
          customer,
          lines,
          totalPrice,
          currency: lines[0]?.currency ?? "DOP",
          locale,
          pickupDate: pickup.date,
          pickupTime: pickup.time,
        }),
      });
      const data = (await res.json()) as SubmitResponse;
      if (data.ok && data.whatsAppUrl) {
        if (data.takeoutId) {
          trackEvent("takeout_submitted", {
            takeoutId: data.takeoutId,
            total: data.total ?? totalPrice,
            itemCount: lines.reduce((sum, l) => sum + l.qty, 0),
            date: new Date().toISOString().slice(0, 10),
          });
        }
        // Build contract §9: render the WhatsApp link as a real <a>
        // anchor the user taps, never a programmatic window.open.
        // Server-recomputed `total` is the authoritative one to display.
        setResult({
          whatsAppUrl: data.whatsAppUrl,
          total: data.total ?? totalPrice,
        });
      } else {
        setErrorMessage(data.message ?? tr(t.errorGeneric));
      }
    } catch {
      setErrorMessage(tr(t.errorGeneric));
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setResult(null);
    setErrorMessage(null);
    clear();
  };

  return { submit, submitting, errorMessage, result, reset };
}

function PickupFields({
  pickupDate,
  pickupTime,
  setPickupDate,
  setPickupTime,
  availableSlots,
  today,
}: {
  pickupDate: string;
  pickupTime: string;
  setPickupDate: (v: string) => void;
  setPickupTime: (v: string) => void;
  availableSlots: string[];
  today: string;
}) {
  const { tr } = useLanguage();
  const inputClass =
    "w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:border-accent transition-colors";
  return (
    <div className="space-y-2 mb-4">
      <p className="text-xs uppercase tracking-[0.2em] text-foreground-muted">
        {tr(t.pickupSection)}
      </p>
      <div className="grid grid-cols-2 gap-2">
        <input
          type="date"
          required
          min={today}
          aria-label={tr(t.pickupDate)}
          value={pickupDate}
          onChange={(e) => setPickupDate(e.target.value)}
          className={inputClass}
        />
        <select
          aria-label={tr(t.pickupTime)}
          required
          value={pickupTime}
          onChange={(e) => setPickupTime(e.target.value)}
          disabled={availableSlots.length === 0}
          className={`${inputClass} disabled:opacity-60`}
        >
          {availableSlots.length === 0 ? (
            <option value="">—</option>
          ) : (
            availableSlots.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))
          )}
        </select>
      </div>
    </div>
  );
}

function CustomerFields({
  name,
  email,
  phone,
  setName,
  setEmail,
  setPhone,
}: {
  name: string;
  email: string;
  phone: string;
  setName: (v: string) => void;
  setEmail: (v: string) => void;
  setPhone: (v: string) => void;
}) {
  const { tr } = useLanguage();
  const inputClass =
    "w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder-foreground-muted/60 focus:outline-none focus:border-accent transition-colors";
  return (
    <div className="space-y-2 mb-4">
      <p className="text-xs uppercase tracking-[0.2em] text-foreground-muted">
        {tr(t.yourInfo)}
      </p>
      <input
        type="text"
        required
        autoComplete="name"
        placeholder={tr(t.fieldName)}
        value={name}
        onChange={(e) => setName(e.target.value)}
        className={inputClass}
      />
      <input
        type="email"
        required
        autoComplete="email"
        inputMode="email"
        placeholder={tr(t.fieldEmail)}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className={inputClass}
      />
      <input
        type="tel"
        autoComplete="tel"
        inputMode="tel"
        placeholder={tr(t.fieldPhone)}
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        className={inputClass}
      />
    </div>
  );
}

export function CartPanel({
  variant,
  pickupSettings,
}: {
  variant: "sidebar" | "drawer";
  pickupSettings: ReservationSettings;
}) {
  const { tr } = useLanguage();
  const { lines, totalItems, totalPrice, inc, dec, remove, clear } = useCart();
  const { submit, submitting, errorMessage, result, reset } = useTakeoutSubmit();

  const today = toLocalDateISO(new Date());
  const allSlots = useMemo(() => buildSlots(pickupSettings), [pickupSettings]);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [pickupDate, setPickupDate] = useState("");
  const [pickupTime, setPickupTime] = useState("");

  const availableSlots = useMemo(
    () => filterByLeadTime(allSlots, pickupDate, pickupSettings),
    [allSlots, pickupDate, pickupSettings],
  );

  // Reset time when the available list shifts under us (e.g. user
  // moved the date back to today and their chosen slot is no longer
  // valid). Mirrors the reservation form's behaviour.
  useEffect(() => {
    if (pickupTime && !availableSlots.includes(pickupTime)) {
      setPickupTime(availableSlots[0] ?? "");
    } else if (!pickupTime && availableSlots.length > 0) {
      setPickupTime(availableSlots[0]);
    }
  }, [availableSlots, pickupTime]);

  const currency = lines[0]?.currency ?? "DOP";
  const empty = lines.length === 0;
  const canSubmit =
    !empty &&
    name.trim().length > 0 &&
    EMAIL_RE.test(email) &&
    !!pickupDate &&
    !!pickupTime &&
    !submitting;

  const handlePlaceOrder = () => {
    if (!canSubmit) return;
    submit(
      {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
      },
      { date: pickupDate, time: pickupTime },
    );
  };

  const handleStartOver = () => {
    setName("");
    setEmail("");
    setPhone("");
    setPickupDate("");
    setPickupTime("");
    reset();
  };

  if (variant === "drawer") {
    return (
      <CartDrawer
        empty={empty}
        totalItems={totalItems}
        totalPrice={totalPrice}
        currency={currency}
        name={name}
        email={email}
        phone={phone}
        setName={setName}
        setEmail={setEmail}
        setPhone={setPhone}
        pickupDate={pickupDate}
        pickupTime={pickupTime}
        setPickupDate={setPickupDate}
        setPickupTime={setPickupTime}
        availableSlots={availableSlots}
        today={today}
        canSubmit={canSubmit}
        submitting={submitting}
        errorMessage={errorMessage}
        onPlaceOrder={handlePlaceOrder}
        result={result}
        onStartOver={handleStartOver}
      />
    );
  }

  if (result) {
    return (
      <aside className="hidden lg:block sticky top-36 max-h-[calc(100vh-10rem)] overflow-y-auto rounded-md border border-border bg-background-elevated p-6">
        <ConfirmationView
          total={result.total}
          currency={currency}
          whatsAppUrl={result.whatsAppUrl}
          onStartOver={handleStartOver}
        />
      </aside>
    );
  }

  return (
    <aside className="hidden lg:block sticky top-36 max-h-[calc(100vh-10rem)] overflow-y-auto rounded-md border border-border bg-background-elevated p-6">
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="font-display text-2xl">{tr(t.yourOrder)}</h2>
        {!empty && (
          <button
            onClick={clear}
            className="text-xs uppercase tracking-[0.18em] text-foreground-muted hover:text-accent transition-colors"
          >
            {tr(t.remove)}
          </button>
        )}
      </div>

      {empty ? (
        <p className="text-foreground-muted text-sm py-6">{tr(t.emptyCart)}</p>
      ) : (
        <>
          <ul className="divide-y divide-border/50 mb-6">
            {lines.map((l) => (
              <li key={l.id} className="py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground">
                      {tr(l.name)}
                    </p>
                    {l.variantLabel && (
                      <p className="text-xs text-foreground-muted">
                        {tr(l.variantLabel)}
                      </p>
                    )}
                  </div>
                  <p className="shrink-0 text-sm text-accent tabular-nums">
                    {formatPrice(l.unitPrice * l.qty, l.currency)}
                  </p>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <div className="inline-flex items-center border border-border rounded-full">
                    <button
                      onClick={() => dec(l.id)}
                      aria-label="decrement"
                      className="w-7 h-7 flex items-center justify-center hover:text-accent transition-colors"
                    >
                      −
                    </button>
                    <span className="px-2 text-sm tabular-nums">{l.qty}</span>
                    <button
                      onClick={() => inc(l.id)}
                      aria-label="increment"
                      className="w-7 h-7 flex items-center justify-center hover:text-accent transition-colors"
                    >
                      +
                    </button>
                  </div>
                  <button
                    onClick={() => remove(l.id)}
                    className="text-xs uppercase tracking-[0.15em] text-foreground-muted/70 hover:text-accent transition-colors"
                  >
                    ×
                  </button>
                </div>
              </li>
            ))}
          </ul>

          <div className="flex items-baseline justify-between mb-4 pt-2 border-t border-border">
            <span className="text-sm uppercase tracking-[0.2em] text-foreground-muted">
              {tr(t.total)}
            </span>
            <span className="font-display text-2xl text-accent tabular-nums">
              {formatPrice(totalPrice, currency)}
            </span>
          </div>

          <PickupFields
            pickupDate={pickupDate}
            pickupTime={pickupTime}
            setPickupDate={setPickupDate}
            setPickupTime={setPickupTime}
            availableSlots={availableSlots}
            today={today}
          />

          <CustomerFields
            name={name}
            email={email}
            phone={phone}
            setName={setName}
            setEmail={setEmail}
            setPhone={setPhone}
          />

          {errorMessage && (
            <p
              role="alert"
              className="mb-3 text-xs text-red-300 bg-red-950/30 border border-red-900/50 rounded-md px-3 py-2"
            >
              {errorMessage}
            </p>
          )}

          <button
            onClick={handlePlaceOrder}
            disabled={!canSubmit}
            className="w-full inline-flex items-center justify-center px-6 py-3 bg-accent text-background uppercase tracking-[0.18em] text-sm rounded-full hover:bg-foreground transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? tr(t.submitting) : tr(t.orderViaWhatsApp)}
          </button>
          <p className="mt-3 text-xs text-foreground-muted/70 text-center">
            {tr(t.placeOrder)} → WhatsApp
          </p>
        </>
      )}
    </aside>
  );
}

function ConfirmationView({
  total,
  currency,
  whatsAppUrl,
  onStartOver,
}: {
  total: number;
  currency: string;
  whatsAppUrl: string | null;
  onStartOver: () => void;
}) {
  const { tr } = useLanguage();
  return (
    <div className="text-center py-6">
      <p className="text-accent text-xs uppercase tracking-[0.4em] mb-3">✓</p>
      <p className="font-display text-2xl mb-3">{tr(t.takeoutReceived)}</p>
      <p className="text-xs uppercase tracking-[0.2em] text-foreground-muted mb-1">
        {tr(t.total)}
      </p>
      <p className="font-display text-3xl text-accent tabular-nums mb-6">
        {formatPrice(total, currency)}
      </p>
      {whatsAppUrl && (
        <a
          href={whatsAppUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() =>
            trackEvent("cta_click", { cta: "whatsapp_confirm_takeout" })
          }
          className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#25D366] text-white uppercase tracking-[0.18em] text-sm rounded-full hover:bg-[#1ebe57] transition-colors mb-3"
        >
          <WhatsAppIcon />
          {tr(t.confirmOrderByWhatsApp)}
        </a>
      )}
      <button
        onClick={onStartOver}
        className="text-xs uppercase tracking-[0.18em] text-foreground-muted hover:text-accent transition-colors"
      >
        {tr(t.startOver)}
      </button>
    </div>
  );
}

function CartDrawer({
  empty,
  totalItems,
  totalPrice,
  currency,
  name,
  email,
  phone,
  setName,
  setEmail,
  setPhone,
  pickupDate,
  pickupTime,
  setPickupDate,
  setPickupTime,
  availableSlots,
  today,
  canSubmit,
  submitting,
  errorMessage,
  onPlaceOrder,
  result,
  onStartOver,
}: {
  empty: boolean;
  totalItems: number;
  totalPrice: number;
  currency: string;
  name: string;
  email: string;
  phone: string;
  setName: (v: string) => void;
  setEmail: (v: string) => void;
  setPhone: (v: string) => void;
  pickupDate: string;
  pickupTime: string;
  setPickupDate: (v: string) => void;
  setPickupTime: (v: string) => void;
  availableSlots: string[];
  today: string;
  canSubmit: boolean;
  submitting: boolean;
  errorMessage: string | null;
  onPlaceOrder: () => void;
  result: TakeoutResult | null;
  onStartOver: () => void;
}) {
  const { tr } = useLanguage();
  const [open, setOpen] = useState(false);
  const { lines, inc, dec, remove, clear } = useCart();

  const summary = useMemo(
    () =>
      empty
        ? tr(t.emptyCart)
        : `${totalItems} · ${formatPrice(totalPrice, currency)}`,
    [empty, totalItems, totalPrice, currency, tr],
  );

  // After a successful order, keep the drawer open and show the
  // confirmation view with the WhatsApp button.
  if (result) {
    return (
      <div
        className="lg:hidden fixed inset-0 z-50 flex items-end"
        aria-modal
        role="dialog"
      >
        <div className="absolute inset-0 bg-black/60" />
        <div className="relative w-full max-h-[85vh] bg-background-elevated border-t border-border rounded-t-2xl p-5 overflow-y-auto">
          <ConfirmationView
            total={result.total}
            currency={currency}
            whatsAppUrl={result.whatsAppUrl}
            onStartOver={onStartOver}
          />
        </div>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => !empty && setOpen(true)}
        disabled={empty}
        className="lg:hidden fixed bottom-4 left-4 right-4 z-40 flex items-center justify-between px-5 py-3 rounded-full bg-accent text-background shadow-xl disabled:bg-background-elevated disabled:text-foreground-muted"
      >
        <span className="text-sm uppercase tracking-[0.18em]">
          {tr(t.yourOrder)}
        </span>
        <span className="text-sm font-medium tabular-nums">{summary}</span>
      </button>

      {open && (
        <div
          className="lg:hidden fixed inset-0 z-50 flex items-end"
          aria-modal
          role="dialog"
        >
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setOpen(false)}
          />
          <div className="relative w-full max-h-[85vh] bg-background-elevated border-t border-border rounded-t-2xl p-5 overflow-y-auto">
            <div className="flex items-baseline justify-between mb-4">
              <h2 className="font-display text-2xl">{tr(t.yourOrder)}</h2>
              <button
                onClick={() => setOpen(false)}
                aria-label="close"
                className="text-2xl text-foreground-muted hover:text-accent"
              >
                ×
              </button>
            </div>

            <ul className="divide-y divide-border/50 mb-6">
              {lines.map((l) => (
                <li key={l.id} className="py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{tr(l.name)}</p>
                      {l.variantLabel && (
                        <p className="text-xs text-foreground-muted">
                          {tr(l.variantLabel)}
                        </p>
                      )}
                    </div>
                    <p className="shrink-0 text-sm text-accent tabular-nums">
                      {formatPrice(l.unitPrice * l.qty, l.currency)}
                    </p>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <div className="inline-flex items-center border border-border rounded-full">
                      <button onClick={() => dec(l.id)} className="w-8 h-8">−</button>
                      <span className="px-2 text-sm tabular-nums">{l.qty}</span>
                      <button onClick={() => inc(l.id)} className="w-8 h-8">+</button>
                    </div>
                    <button
                      onClick={() => remove(l.id)}
                      className="text-xs uppercase tracking-[0.15em] text-foreground-muted/70"
                    >
                      ×
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            <div className="flex items-baseline justify-between mb-4 pt-2 border-t border-border">
              <span className="text-sm uppercase tracking-[0.2em] text-foreground-muted">
                {tr(t.total)}
              </span>
              <span className="font-display text-2xl text-accent tabular-nums">
                {formatPrice(totalPrice, currency)}
              </span>
            </div>

            <PickupFields
              pickupDate={pickupDate}
              pickupTime={pickupTime}
              setPickupDate={setPickupDate}
              setPickupTime={setPickupTime}
              availableSlots={availableSlots}
              today={today}
            />

            <CustomerFields
              name={name}
              email={email}
              phone={phone}
              setName={setName}
              setEmail={setEmail}
              setPhone={setPhone}
            />

            {errorMessage && (
              <p
                role="alert"
                className="mb-3 text-xs text-red-300 bg-red-950/30 border border-red-900/50 rounded-md px-3 py-2"
              >
                {errorMessage}
              </p>
            )}

            <button
              onClick={() => {
                setOpen(false);
                onPlaceOrder();
              }}
              disabled={!canSubmit}
              className="w-full px-6 py-3 bg-accent text-background uppercase tracking-[0.18em] text-sm rounded-full hover:bg-foreground transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? tr(t.submitting) : tr(t.orderViaWhatsApp)}
            </button>
            <button
              onClick={clear}
              className="mt-3 w-full text-xs uppercase tracking-[0.18em] text-foreground-muted hover:text-accent"
            >
              {tr(t.remove)}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
