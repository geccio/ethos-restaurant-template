"use client";

import Link from "next/link";
import { useLanguage } from "./LanguageProvider";
import { restaurant } from "@/data/restaurant";
import { t } from "@/data/translations";

// Hero copy comes from /api/public/site-info. `tagline` is rendered in
// the dashboard's chosen language (single-language by design — the
// dashboard has no bilingual editor). UI labels like "RESERVAR" still
// translate via LanguageProvider.
export function Hero({
  tagline,
  heroImage,
}: {
  tagline: string;
  heroImage: string;
}) {
  const { tr } = useLanguage();

  return (
    <section
      id="top"
      className="relative min-h-screen flex items-center justify-center overflow-hidden grain"
    >
      <div
        aria-hidden
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${heroImage})` }}
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/55 to-background"
      />
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 50% at 50% 40%, rgba(201,163,104,0.18) 0%, rgba(11,11,12,0) 70%)",
        }}
      />

      <div className="relative z-10 text-center px-6 max-w-3xl flex flex-col items-center">
        {restaurant.logoWordmark ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={restaurant.logoWordmark}
            alt={restaurant.name}
            className="h-40 sm:h-64 w-auto mb-8"
          />
        ) : (
          <h1 className="font-display text-6xl sm:text-8xl leading-[1.05] text-foreground mb-8">
            {restaurant.name}
          </h1>
        )}
        <p className="font-display text-2xl sm:text-3xl leading-snug text-foreground-muted italic mb-10 max-w-xl">
          {tagline}
        </p>
        <Link
          href="/reserve"
          className="inline-flex items-center justify-center px-10 py-4 bg-accent text-background font-medium uppercase tracking-[0.2em] text-sm rounded-full hover:bg-foreground transition-colors"
        >
          {tr(t.reserve)}
        </Link>
      </div>

      <div
        aria-hidden
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-foreground-muted text-xs uppercase tracking-[0.3em]"
      >
        ↓
      </div>
    </section>
  );
}
