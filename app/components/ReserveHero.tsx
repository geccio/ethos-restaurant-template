"use client";

import { useLanguage } from "./LanguageProvider";
import { restaurant } from "@/data/restaurant";
import { t } from "@/data/translations";

export function ReserveHero() {
  return <ReserveHeroInner />;
}

function ReserveHeroInner() {
  const { tr } = useLanguage();
  return (
    <section className="pt-32 sm:pt-36 pb-12 px-6 sm:px-10">
      <div className="max-w-2xl mx-auto text-center">
        <p className="text-accent text-xs uppercase tracking-[0.4em] mb-4">
          {restaurant.name} · {tr(t.reservation)}
        </p>
        <h1 className="font-display text-5xl sm:text-6xl leading-[1.05] mb-6">
          {tr(t.reservationTitle)}
        </h1>
        <p className="text-foreground-muted text-lg">
          {tr(t.reservationSubtitle)}
        </p>
      </div>
    </section>
  );
}
