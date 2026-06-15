"use client";

import { useLanguage } from "./LanguageProvider";
import { t } from "@/data/translations";

// Tagline + about copy come from /api/public/site-info, single
// language (the dashboard's). UI labels still translate.
export function About({
  tagline,
  about,
}: {
  tagline: string;
  about: string;
}) {
  const { tr } = useLanguage();

  return (
    <section id="about" className="px-6 sm:px-10 py-20 sm:py-28 border-t border-border">
      <div className="max-w-3xl mx-auto text-center">
        <p className="text-accent text-xs uppercase tracking-[0.4em] mb-6">
          {tr(t.aboutUs)}
        </p>
        <h2 className="font-display text-4xl sm:text-5xl leading-tight mb-8">
          {tagline}
        </h2>
        <p className="text-foreground-muted leading-relaxed text-lg">
          {about}
        </p>
      </div>
    </section>
  );
}
