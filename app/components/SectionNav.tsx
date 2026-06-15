"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "./LanguageProvider";
import { menu } from "@/data/menu";

// Sticky menu-section nav with scroll-spy.
// All pills are visible (flex-wrap) — no horizontal scroll.
export function SectionNav() {
  const { tr } = useLanguage();
  const [active, setActive] = useState<string | null>(menu[0]?.id ?? null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length === 0) return;
        const topmost = visible.reduce((a, b) =>
          Math.abs(a.boundingClientRect.top) < Math.abs(b.boundingClientRect.top) ? a : b,
        );
        setActive(topmost.target.id);
      },
      { rootMargin: "-160px 0px -65% 0px", threshold: 0 },
    );

    const els = menu
      .map((s) => document.getElementById(s.id))
      .filter((el): el is HTMLElement => !!el);
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="sticky top-[4.5rem] z-30 backdrop-blur-md bg-background/85 border-b border-border/50">
      <nav
        aria-label="menu sections"
        className="max-w-6xl mx-auto px-3 sm:px-6 py-2.5 flex flex-wrap justify-center gap-1.5 sm:gap-2"
      >
        {menu.map((s) => {
          const isActive = active === s.id;
          return (
            <a
              key={s.id}
              href={`#${s.id}`}
              data-section={s.id}
              className={`text-[10px] sm:text-xs uppercase tracking-[0.14em] sm:tracking-[0.18em] rounded-full px-2.5 py-1.5 sm:px-3.5 sm:py-1.5 border transition-colors whitespace-nowrap ${
                isActive
                  ? "text-accent border-accent bg-accent/10"
                  : "text-foreground-muted border-border/60 hover:text-accent hover:border-accent"
              }`}
            >
              {tr(s.title).split("·")[0].trim()}
            </a>
          );
        })}
      </nav>
    </div>
  );
}
