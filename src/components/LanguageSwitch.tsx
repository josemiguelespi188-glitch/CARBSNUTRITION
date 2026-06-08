"use client";

import { useLocale } from "@/lib/i18n/context";

export function LanguageSwitch() {
  const { locale, toggleLocale } = useLocale();
  return (
    <button
      onClick={toggleLocale}
      className="rounded-full border border-neutral-700 px-4 py-1.5 text-xs font-medium tracking-widest uppercase text-neutral-300 hover:border-white hover:text-white transition-colors"
      aria-label="Toggle language"
    >
      {locale === "en" ? "EN · ES" : "ES · EN"}
    </button>
  );
}
