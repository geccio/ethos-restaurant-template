"use client";

import { useLanguage } from "./LanguageProvider";
import { menu } from "@/data/menu";
import { t } from "@/data/translations";
import type { MenuItem } from "@/data/types";

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

function ItemRow({ item }: { item: MenuItem }) {
  const { tr } = useLanguage();

  return (
    <li className="py-6">
      <div className="flex items-baseline gap-6">
        <div className="flex-1 min-w-0">
          <h4 className="font-display text-xl text-foreground">{tr(item.name)}</h4>
          {item.description && (
            <p className="mt-1 text-foreground-muted text-sm leading-relaxed">
              {tr(item.description)}
            </p>
          )}
        </div>
        <div
          aria-hidden
          className="hidden sm:block flex-1 border-b border-dotted border-border/60 self-end mb-2"
        />
        {item.price !== undefined && (
          <div className="text-accent font-display text-xl tabular-nums whitespace-nowrap">
            {formatPrice(item.price, item.currency)}
          </div>
        )}
      </div>

      {item.variants && item.variants.length > 0 && (
        <ul className="mt-3 sm:pl-4 space-y-1.5">
          {item.variants.map((v, i) => (
            <li
              key={`${item.id}-v-${i}`}
              className="flex items-baseline gap-3 text-sm"
            >
              <span className="text-foreground-muted">{tr(v.name)}</span>
              <span
                aria-hidden
                className="flex-1 border-b border-dotted border-border/40 self-end mb-1.5"
              />
              <span className="text-accent tabular-nums whitespace-nowrap">
                {formatPrice(v.price, item.currency)}
              </span>
            </li>
          ))}
        </ul>
      )}

      {item.note && (
        <p className="mt-2 text-xs uppercase tracking-[0.15em] text-foreground-muted/80">
          {tr(item.note)}
        </p>
      )}
    </li>
  );
}

export function Menu() {
  const { tr } = useLanguage();

  return (
    <section id="menu" className="px-6 sm:px-10 py-20 sm:py-24">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-accent text-xs uppercase tracking-[0.4em] mb-4">
            {tr(t.ourMenu)}
          </p>
          <h2 className="font-display text-5xl sm:text-6xl">{tr(t.menu)}</h2>
        </div>

        <div className="space-y-20">
          {menu.map((section) => (
            <div key={section.id} id={section.id} className="scroll-mt-36">
              <h3 className="font-display text-2xl sm:text-3xl text-accent uppercase tracking-[0.18em] mb-8 pb-3 border-b border-border/60">
                {tr(section.title)}
              </h3>
              <ul className="divide-y divide-border/40">
                {section.items.map((item) => (
                  <ItemRow key={item.id} item={item} />
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
