// Client-side analytics helper. Fire-and-forget — never awaited from
// callsites and never throws. The /api/track route proxies to Ethos so
// the API key stays server-side.
export function trackEvent(
  type: string,
  payload?: Record<string, unknown>,
): void {
  if (typeof window === "undefined") return;
  const body = JSON.stringify({ type, payload });
  try {
    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: "application/json" });
      if (navigator.sendBeacon("/api/track", blob)) return;
    }
  } catch {
    // fall through
  }
  void fetch("/api/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => {});
}
