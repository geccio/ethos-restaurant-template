"use client";

import { useLanguage } from "./LanguageProvider";
import { t } from "@/data/translations";

export function TakeoutHero() {
  const { tr } = useLanguage();

  return (
    <section className="pt-32 sm:pt-36 pb-8 px-6 sm:px-10">
      <div className="max-w-7xl mx-auto text-center">
        <p className="text-accent text-xs uppercase tracking-[0.4em] mb-4">
          {tr(t.takeout)}
        </p>
        <h1 className="font-display text-5xl sm:text-7xl leading-[1.05]">
          {tr(t.yourOrder)}
        </h1>
      </div>
    </section>
  );
}
