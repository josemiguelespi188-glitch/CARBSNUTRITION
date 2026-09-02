"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLocale } from "@/lib/i18n/context";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { AssessmentAnswers, CustomMix } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";

const FLAVOR_META: Record<string, { en: string; es: string; color: string }> = {
  peach:     { en: "Peach",     es: "Durazno", color: "#E8946A" },
  kiwi:      { en: "Kiwi",      es: "Kiwi",    color: "#6BAF5E" },
  pineapple: { en: "Pineapple", es: "Piña",    color: "#E8C44A" },
  mango:     { en: "Mango",     es: "Mango",   color: "#E8A040" },
};

export default function PerfilPage() {
  const { locale } = useLocale();
  const isEn = locale === "en";
  const [user, setUser]       = useState<{ name: string; email: string; phone: string } | null>(null);
  const [answers, setAnswers] = useState<AssessmentAnswers | null>(null);
  const [mix, setMix]         = useState<CustomMix | null>(null);
  const [flavor, setFlavor]   = useState<typeof FLAVOR_META[string] | null>(null);

  useEffect(() => {
    // Load from sessionStorage
    try {
      const u = sessionStorage.getItem("zenit:user");
      if (u) setUser(JSON.parse(u));
      const a = sessionStorage.getItem("carbyn:answers");
      if (a) setAnswers(JSON.parse(a) as AssessmentAnswers);
      const m = sessionStorage.getItem("carbyn:mix");
      if (m) setMix(JSON.parse(m) as CustomMix);
      const f = sessionStorage.getItem("zenit:flavor");
      if (f && FLAVOR_META[f]) setFlavor(FLAVOR_META[f]);
    } catch { /* ignore */ }

    // Try Supabase
    (async () => {
      try {
        const supabase = createClient();
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser) {
          const meta = authUser.user_metadata as { name?: string; phone?: string };
          setUser({ name: meta.name || "", email: authUser.email || "", phone: meta.phone || "" });
        }
      } catch { /* Supabase not configured */ }
    })();
  }, []);

  const name = user?.name || answers?.name || "Athlete";
  const email = user?.email || answers?.email || "";

  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <SiteHeader />
      <main className="flex-1 px-6 pt-28 pb-24">
        <div className="mx-auto max-w-3xl">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-ink-3">{isEn ? "My profile" : "Mi perfil"}</p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-ink"
                style={{ fontFamily: "var(--font-jetbrains-mono,'JetBrains Mono',monospace)" }}>
                {name}
              </h1>
              {email && <p className="mt-1 text-sm text-ink-3">{email}</p>}
            </div>
            <Link href="/mix"><Button variant="ghost" size="sm">{isEn ? "Edit formula" : "Editar fórmula"}</Button></Link>
          </div>

          {/* Current mix */}
          {mix ? (
            <section className="mt-10">
              <p className="text-xs uppercase tracking-widest text-ink-3 mb-4">{isEn ? "Your formula" : "Tu fórmula"}</p>
              <div className="rounded-2xl border border-line bg-surface p-6">
                <div className="flex items-start gap-4">
                  {flavor && (
                    <div className="h-12 w-12 rounded-2xl shrink-0" style={{ background: flavor.color }} />
                  )}
                  <div className="flex-1">
                    <p className="font-semibold text-ink">{mix.packageLabel}</p>
                    <p className="mt-1 text-xs text-ink-3 italic">{mix.motivationalMessage[locale]}</p>
                    <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        [isEn ? "Carbs" : "Carbos", `${mix.carbsPerServing}g`],
                        [isEn ? "Sodium" : "Sodio", `${mix.sodiumPerServing}mg`],
                        [isEn ? "Caffeine" : "Cafeína", `${mix.caffeinePerServing}mg`],
                        [isEn ? "Ratio" : "Proporción", mix.ratio],
                      ].map(([k, v]) => (
                        <div key={k} className="rounded-xl border border-line bg-surface-2 px-3 py-3">
                          <p className="text-[10px] uppercase tracking-widest text-ink-3">{k}</p>
                          <p className="mt-1 text-sm font-semibold text-ink" style={{ fontFamily: "var(--font-jetbrains-mono,'JetBrains Mono',monospace)" }}>{v}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="mt-5 flex gap-3">
                  <Link href="/mix"><Button size="sm">{isEn ? "Reorder" : "Pedir de nuevo"}</Button></Link>
                  <Link href="/mix"><Button variant="ghost" size="sm">{isEn ? "Edit" : "Editar"}</Button></Link>
                </div>
              </div>
            </section>
          ) : (
            <section className="mt-10 rounded-2xl border border-line bg-surface-2 p-8 text-center">
              <p className="text-ink-2">{isEn ? "No formula yet." : "Aún no tienes una fórmula."}</p>
              <Link href="/" className="mt-4 inline-block">
                <Button variant="outline" size="sm">{isEn ? "Get my formula" : "Obtener mi fórmula"}</Button>
              </Link>
            </section>
          )}

          {/* Athlete profile */}
          {answers && (
            <section className="mt-10">
              <p className="text-xs uppercase tracking-widest text-ink-3 mb-4">{isEn ? "Athlete profile" : "Perfil del atleta"}</p>
              <div className="rounded-2xl border border-line bg-surface p-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {([
                    [isEn ? "Sport" : "Deporte", answers.sportType],
                    [isEn ? "Training" : "Entrenamiento", `${answers.trainingHoursPerWeek}h/wk`],
                    [isEn ? "Sweat rate" : "Sudoración", answers.sweatRate],
                    [isEn ? "Caffeine tol." : "Tolerancia caf.", answers.caffeineTolerance],
                    [isEn ? "Carb target" : "Objetivo carbs", `${answers.carbTargetPerHour}g/hr`],
                    [isEn ? "Goal" : "Objetivo", answers.goal],
                  ] as [string, string][]).map(([k, v]) => (
                    <div key={k}>
                      <p className="text-[10px] uppercase tracking-widest text-ink-3">{k}</p>
                      <p className="mt-0.5 text-sm text-ink capitalize">{v}</p>
                    </div>
                  ))}
                </div>
                {answers.eventName && (
                  <div className="mt-4 pt-4 border-t border-line">
                    <p className="text-xs uppercase tracking-widest text-ink-3 mb-1">{isEn ? "Next event" : "Próximo evento"}</p>
                    <p className="text-sm text-ink">{answers.eventName}</p>
                    {answers.eventDate && <p className="text-xs text-ink-3 mt-0.5">{new Date(answers.eventDate).toLocaleDateString(isEn ? "en-US" : "es")}</p>}
                  </div>
                )}
                <div className="mt-5">
                  <Link href="/mix"><Button variant="ghost" size="sm">{isEn ? "Update profile" : "Actualizar perfil"}</Button></Link>
                </div>
              </div>
            </section>
          )}

          {/* Orders */}
          <section className="mt-10">
            <p className="text-xs uppercase tracking-widest text-ink-3 mb-4">{isEn ? "Orders" : "Pedidos"}</p>
            <div className="rounded-2xl border border-line bg-surface-2 p-8 text-center">
              <p className="text-sm text-ink-3">{isEn ? "Order history will appear here after your first purchase." : "El historial de pedidos aparecerá aquí después de tu primera compra."}</p>
              {mix && (
                <Link href="/mix" className="mt-4 inline-block">
                  <Button size="sm">{isEn ? "Place first order" : "Hacer primer pedido"}</Button>
                </Link>
              )}
            </div>
          </section>

          <div className="mt-10 text-center">
            <button
              onClick={async () => {
                try { const s = createClient(); await s.auth.signOut(); } catch { /* ignore */ }
                try { sessionStorage.clear(); } catch { /* ignore */ }
                window.location.href = "/";
              }}
              className="text-xs text-ink-3 hover:text-ink-2 underline underline-offset-4"
            >
              {isEn ? "Sign out" : "Cerrar sesión"}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
