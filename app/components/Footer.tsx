"use client";

import { useLanguage } from "./LanguageProvider";
import { t } from "@/data/translations";

export function Footer({ siteName }: { siteName: string }) {
  const { tr } = useLanguage();
  const year = new Date().getFullYear();

  return (
    <footer className="px-6 sm:px-10 py-12 border-t border-border text-foreground-muted text-sm">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="font-display text-foreground text-xl">{siteName}</p>
        <p className="text-xs uppercase tracking-[0.2em]">
          © {year} {siteName} · {tr(t.poweredBy)}
        </p>
      </div>
    </footer>
  );
}
