"use client";

import { useLanguage } from "./LanguageProvider";
import { useCart } from "./CartProvider";
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

function AddButton({
  onClick,
  label,
}: {
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className="shrink-0 inline-flex items-center justify-center min-w-[36px] h-9 px-3 text-xs uppercase tracking-[0.18em] rounded-full bg-accent text-background hover:bg-foreground transition-colors"
      aria-label={label}
    >
      + {label}
    </button>
  );
}

function ItemRow({ item }: { item: MenuItem }) {
  const { tr } = useLanguage();
  const { add } = useCart();

  const addLabel = tr(t.add);

  return (
    <li className="py-6 border-b border-border/40">
      <div className="flex items-start gap-4">
        <div className="flex-1 min-w-0">
          <h4 className="font-display text-xl text-foreground">{tr(item.name)}</h4>
          {item.description && (
            <p className="mt-1 text-foreground-muted text-sm leading-relaxed">
              {tr(item.description)}
            </p>
          )}
          {item.note && (
            <p className="mt-2 text-xs uppercase tracking-[0.15em] text-foreground-muted/80">
              {tr(item.note)}
            </p>
          )}
        </div>

        {item.price !== undefined && (
          <div className="flex items-center gap-3 shrink-0">
            <div className="text-accent font-display text-xl tabular-nums whitespace-nowrap">
              {formatPrice(item.price, item.currency)}
            </div>
            <AddButton
              label={addLabel}
              onClick={() =>
                add({
                  itemId: item.id,
                  variantIndex: null,
                  name: item.name,
                  variantLabel: null,
                  unitPrice: item.price as number,
                  currency: item.currency,
                })
              }
            />
          </div>
        )}
      </div>

      {item.variants && item.variants.length > 0 && (
        <ul className="mt-4 sm:pl-4 space-y-2">
          {item.variants.map((v, i) => (
            <li
              key={`${item.id}-v-${i}`}
              className="flex items-center gap-3 text-sm"
            >
              <span className="flex-1 text-foreground-muted">{tr(v.name)}</span>
              <span className="text-accent tabular-nums whitespace-nowrap font-display text-base">
                {formatPrice(v.price, item.currency)}
              </span>
              <AddButton
                label={addLabel}
                onClick={() =>
                  add({
                    itemId: item.id,
                    variantIndex: i,
                    name: item.name,
                    variantLabel: v.name,
                    unitPrice: v.price,
                    currency: item.currency,
                  })
                }
              />
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

export function TakeoutMenu() {
  const { tr } = useLanguage();

  return (
    <div className="space-y-16">
      {menu.map((section) => (
        <section key={section.id} id={section.id} className="scroll-mt-36">
          <h3 className="font-display text-2xl sm:text-3xl text-accent uppercase tracking-[0.18em] mb-6 pb-3 border-b border-border/60">
            {tr(section.title)}
          </h3>
          <ul>
            {section.items.map((item) => (
              <ItemRow key={item.id} item={item} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
