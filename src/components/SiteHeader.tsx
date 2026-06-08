"use client";

import Link from "next/link";
import { useLocale } from "@/lib/i18n/context";
import { LanguageSwitch } from "./LanguageSwitch";
import { Button } from "./ui/button";

export function SiteHeader() {
  const { t } = useLocale();
  return (
    <header className="fixed top-0 inset-x-0 z-50 border-b border-neutral-900 bg-black/70 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-lg font-bold tracking-[0.3em] text-white">
          {t.brand.name}
        </Link>
        <nav className="hidden items-center gap-6 sm:flex">
          <Link href="/dashboard" className="text-sm text-neutral-400 hover:text-white transition-colors">
            {t.nav.dashboard}
          </Link>
          <LanguageSwitch />
          <Link href="/assessment">
            <Button size="sm">{t.nav.assessment}</Button>
          </Link>
        </nav>
        <div className="flex items-center gap-3 sm:hidden">
          <LanguageSwitch />
          <Link href="/assessment">
            <Button size="sm">{t.nav.assessment}</Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
