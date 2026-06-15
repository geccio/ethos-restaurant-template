"use client";

import Link from "next/link";
import { useLanguage } from "./LanguageProvider";
import { restaurant } from "@/data/restaurant";
import { t } from "@/data/translations";

// `siteName` comes from /api/public/site-info via the server-rendered
// layout. Used for the brand alt text + the wordmark fallback when the
// logo isn't loaded.
export function Header({ siteName }: { siteName: string }) {
  const { tr, toggle, locale } = useLanguage();

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-background/70 border-b border-border/40">
      <div className="px-6 sm:px-10 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          {restaurant.logoIcon ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={restaurant.logoIcon}
              alt={siteName}
              className="h-10 w-auto"
            />
          ) : (
            <span className="font-display text-2xl tracking-wide text-foreground">
              {siteName}
            </span>
          )}
        </Link>

        <nav className="hidden sm:flex items-center gap-8 text-sm uppercase tracking-[0.18em] text-foreground-muted">
          <Link href="/menu" className="hover:text-accent transition-colors">
            {tr(t.menu)}
          </Link>
          <Link href="/#about" className="hover:text-accent transition-colors">
            {tr(t.aboutUs)}
          </Link>
          <Link href="/#location" className="hover:text-accent transition-colors">
            {tr(t.location)}
          </Link>
        </nav>

        <button
          onClick={toggle}
          aria-label={`Switch language to ${locale === "es" ? "English" : "Spanish"}`}
          className="text-xs uppercase tracking-[0.2em] border border-border px-3 py-2 rounded-full hover:border-accent hover:text-accent transition-colors"
        >
          {tr(t.switchLanguage)}
        </button>
      </div>
    </header>
  );
}
