"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale } from "@/lib/i18n/context";
import { createClient } from "@/lib/supabase/client";
import { LanguageSwitch } from "./LanguageSwitch";
import { Button } from "./ui/button";

export function SiteHeader() {
  const { t, locale } = useLocale();
  const router = useRouter();
  const isEn = locale === "en";
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setSignedIn(!!data.user));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setSignedIn(!!session?.user);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setSignedIn(false);
    router.push("/");
  }

  return (
    <header className="fixed top-0 inset-x-0 z-50 border-b border-line bg-bg/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex flex-col leading-none">
          <span
            className="text-lg font-black tracking-[0.25em] text-ink"
            style={{ fontFamily: "var(--font-jetbrains-mono, 'JetBrains Mono', monospace)" }}
          >
            {t.brand.name}
          </span>
          <span className="text-[9px] uppercase tracking-[0.5em] text-ink-3 -mt-0.5">
            nutrition
          </span>
        </Link>
        <nav className="hidden items-center gap-6 sm:flex">
          {signedIn ? (
            <>
              <Link href="/dashboard" className="text-sm text-ink-2 hover:text-ink transition-colors">
                {t.nav.dashboard}
              </Link>
              <button onClick={signOut} className="text-sm text-ink-2 hover:text-ink transition-colors">
                {isEn ? "Sign Out" : "Cerrar Sesión"}
              </button>
            </>
          ) : (
            <Link href="/auth" className="text-sm text-ink-2 hover:text-ink transition-colors">
              {isEn ? "Sign In" : "Iniciar Sesión"}
            </Link>
          )}
          <Link href="/admin" className="text-sm text-ink-3 hover:text-ink transition-colors">
            Admin
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
