// Server-side cache of the Ethos site profile.
//
// Per the build contract §3, the menu/hours/hero/about/etc. come from
// /api/public/site-info and may be cached for up to 5 minutes. We
// fetch on demand and memoise the response for 300s. On failure we
// fall back to a hardcoded shape derived from data/restaurant.ts so
// the site never serves blanks — the contract forbids "TBD"
// placeholders, not "the last known good value while the upstream is
// momentarily flaky".
//
// This module is server-only. Components import getSiteInfoSafe from
// a server boundary (page.tsx, layout.tsx, route handlers); the data
// flows down as props.
import "server-only";
import {
  ethosClient,
  isEthosConfigured,
  type SiteInfo,
} from "@/lib/ethos-server";
import { restaurant } from "@/data/restaurant";

const CACHE_TTL_MS = 5 * 60_000;

type CacheEntry = { fetchedAt: number; data: SiteInfo };
let cache: CacheEntry | null = null;
let inflight: Promise<SiteInfo> | null = null;

async function fetchFresh(): Promise<SiteInfo> {
  if (inflight) return inflight;
  inflight = ethosClient
    .getSiteInfo()
    .then((data) => {
      cache = { fetchedAt: Date.now(), data };
      return data;
    })
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

// Returns the site profile, falling back to the hardcoded restaurant
// data when Ethos is unreachable or unconfigured. Never throws.
export async function getSiteInfoSafe(): Promise<{
  source: "ethos" | "fallback";
  data: SiteInfo;
}> {
  const fallback = buildFallback();

  if (!isEthosConfigured()) {
    return { source: "fallback", data: fallback };
  }

  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS) {
    return { source: "ethos", data: cache.data };
  }

  try {
    const data = await fetchFresh();
    return { source: "ethos", data };
  } catch {
    if (cache) return { source: "ethos", data: cache.data };
    return { source: "fallback", data: fallback };
  }
}

// Lets a hard-refresh of site-info skip the cache window — used after
// the dashboard has just published an edit and we want to verify.
export function bustSiteInfoCache(): void {
  cache = null;
}

function buildFallback(): SiteInfo {
  return {
    ok: true,
    siteId: "fallback",
    slug: "fallback",
    status: "active",
    currency: "DOP",
    takeoutEnabled: true,
    info: {
      name: restaurant.name,
      tagline: restaurant.slogan.es,
      about: restaurant.about.es,
      phone: restaurant.contact.phone,
      address: `${restaurant.contact.address.es}, ${restaurant.contact.city.es}`,
      contactEmail: restaurant.contact.email,
      instagram: restaurant.contact.instagram,
      facebook: "",
      twitter: "",
      heroImage: restaurant.heroImage,
      aboutImage: null,
      gallery: restaurant.localPhotos,
      hours: {
        weekdays: "Lunes — Jueves: 12:00 — 23:00",
        weekend: "Viernes — Sábado: 12:00 — 01:00",
        sunday: "Domingo: 12:00 — 23:00",
      },
      mapsEmbed: restaurant.contact.googleMapsEmbedSrc,
      reviews: [],
    },
    reservationSettings: {
      openTime: "12:00",
      closeTime: "22:00",
      slotMinutes: 30,
      leadHours: 2,
      maxPartySize: 20,
      capacity: 40,
      durationMinutes: 90,
    },
  };
}
