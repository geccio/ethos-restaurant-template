"use client";

import { useLanguage } from "./LanguageProvider";
import { restaurant } from "@/data/restaurant";
import { t } from "@/data/translations";

export function MenuHero() {
  const { tr } = useLanguage();

  return (
    <section className="pt-32 sm:pt-36 pb-12 px-6 sm:px-10">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-accent text-xs uppercase tracking-[0.4em] mb-4">
            {restaurant.name} · {tr(t.menu)}
          </p>
          <h1 className="font-display text-5xl sm:text-7xl leading-[1.05]">
            {tr(t.ourMenu)}
          </h1>
        </div>

        {restaurant.foodPhotos.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {restaurant.foodPhotos.map((src, i) => (
              <div
                key={src}
                className="aspect-square bg-background-elevated border border-border bg-cover bg-center"
                style={{ backgroundImage: `url(${src})` }}
                role="img"
                aria-label={`${restaurant.name} food ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
