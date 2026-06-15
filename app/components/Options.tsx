"use client";

import Link from "next/link";
import { useLanguage } from "./LanguageProvider";
import { t } from "@/data/translations";

type Card = {
  label: string;
  href: string;
  image: string;
  caption?: string;
};

export function Options() {
  const { tr } = useLanguage();

  const cards: Card[] = [
    {
      label: tr(t.menu),
      href: "/menu",
      image: "/images/card-menu.jpg",
    },
    {
      label: tr(t.reservation),
      href: "/reserve",
      image: "/images/card-reservation.jpg",
    },
    {
      label: tr(t.takeout),
      href: "/takeout",
      image: "/images/card-takeout.jpg",
    },
  ];

  return (
    <section className="px-6 sm:px-10 py-20 sm:py-28 border-t border-border">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        {cards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="group relative aspect-[5/3] md:aspect-[4/5] rounded-sm border border-border bg-background-elevated overflow-hidden flex items-end p-6 lg:p-8 hover:border-accent transition-colors"
          >
            <div
              aria-hidden
              className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
              style={{ backgroundImage: `url(${card.image})` }}
            />
            <div
              aria-hidden
              className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/20 group-hover:to-background/10 transition-colors"
            />
            <div className="relative z-10">
              <h3 className="font-display text-3xl lg:text-4xl text-foreground group-hover:text-accent transition-colors break-words">
                {card.label}
              </h3>
              {card.caption && (
                <p className="mt-2 text-xs uppercase tracking-[0.25em] text-foreground-muted">
                  {card.caption}
                </p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
