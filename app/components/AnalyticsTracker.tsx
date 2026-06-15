"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

// Fires a `page_view` event into Ethos on every route change. The
// effect runs once after the first paint and once after each
// subsequent navigation. All sends are fire-and-forget — analytics
// must never block or surface errors to the user.
function postPageView(path: string) {
  if (typeof window === "undefined") return;
  const body = JSON.stringify({
    type: "page_view",
    payload: {
      path,
      referrer: document.referrer || null,
      title: document.title || null,
    },
  });

  // sendBeacon survives page unloads cleanly. fetch keepalive is the
  // fallback when the browser doesn't support sendBeacon.
  try {
    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: "application/json" });
      if (navigator.sendBeacon("/api/track", blob)) return;
    }
  } catch {
    // fall through to fetch
  }
  void fetch("/api/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => {});
}

export function AnalyticsTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastSent = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname) return;
    const qs = searchParams?.toString() ?? "";
    const fullPath = qs ? `${pathname}?${qs}` : pathname;
    if (lastSent.current === fullPath) return;
    lastSent.current = fullPath;
    postPageView(fullPath);
  }, [pathname, searchParams]);

  return null;
}
