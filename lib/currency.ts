// Currency formatting driven by /api/public/site-info `currency`.
// Build contract §"Restricciones duras" — never hardcode a symbol,
// never assume DOP/USD. Treat absent currency as "DOP" per the
// contract's fallback rule.

import type { Locale } from "@/data/types";

const LOCALE_MAP: Record<Locale, string> = {
  es: "es-DO",
  en: "en-US",
};

export function formatCurrency(
  value: number,
  currency: string | undefined,
  locale: Locale = "es",
): string {
  const cur = currency || "DOP";
  try {
    return new Intl.NumberFormat(LOCALE_MAP[locale], {
      style: "currency",
      currency: cur,
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${cur} ${value.toLocaleString()}`;
  }
}
