"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLocale } from "@/lib/i18n/context";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { AssessmentAnswers, CustomMix, RaceNutritionPlan } from "@/lib/types";
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
  const [user, setUser]         = useState<{ name: string; email: string; phone: string } | null>(null);
  const [answers, setAnswers]   = useState<AssessmentAnswers | null>(null);
  const [mix, setMix]           = useState<CustomMix | null>(null);
  const [flavor, setFlavor]     = useState<typeof FLAVOR_META[string] | null>(null);
  const [racePlan, setRacePlan] = useState<RaceNutritionPlan | null>(null);

  useEffect(() => {
    try {
      const u = sessionStorage.getItem("zenit:user");
      if (u) setUser(JSON.parse(u));
      const a = sessionStorage.getItem("carbyn:answers");
      if (a) setAnswers(JSON.parse(a) as AssessmentAnswers);
      const m = sessionStorage.getItem("carbyn:mix");
      if (m) setMix(JSON.parse(m) as CustomMix);
      const f = sessionStorage.getItem("zenit:flavor");
      if (f && FLAVOR_META[f]) setFlavor(FLAVOR_META[f]);
      const rp = sessionStorage.getItem("carbyn:racePlan");
      if (rp) setRacePlan(JSON.parse(rp) as RaceNutritionPlan);
    } catch { /* ignore */ }

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

  const eventDate = answers?.eventDate ? new Date(answers.eventDate) : null;
  const today = new Date();
  const daysToEvent = eventDate ? Math.max(0, Math.floor((eventDate.getTime() - today.getTime()) / 86400000)) : null;
  const showReorderNudge = daysToEvent !== null && daysToEvent <= 28 && !racePlan;

  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <SiteHeader />
      <main className="flex-1 px-6 pt-28 pb-24">
        <div className="mx-auto max-w-3xl">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-ink-3">{isEn ? "My profile" : "Mi perfil"}</p>
              <div className="flex items-end gap-4 mt-2">
                <h1 className="text-3xl font-bold tracking-tight text-ink"
                  style={{ fontFamily: "var(--font-jetbrains-mono,'JetBrains Mono',monospace)" }}>
                  {name}
                </h1>
                {daysToEvent !== null && (
                  <div className="mb-1 flex items-baseline gap-1">
                    <span className="text-3xl font-black leading-none"
                      style={{ fontFamily: "var(--font-jetbrains-mono,'JetBrains Mono',monospace)", color: daysToEvent <= 14 ? "#E8946A" : "var(--ink)" }}>
                      {daysToEvent}
                    </span>
                    <span className="text-xs uppercase tracking-widest text-ink-3">
                      {isEn ? "days" : "días"}
                    </span>
                  </div>
                )}
              </div>
              {email && <p className="mt-1 text-sm text-ink-3">{email}</p>}
              {answers?.eventName && daysToEvent !== null && (
                <p className="text-xs text-ink-3 mt-1">
                  {isEn ? `until ${answers.eventName}` : `para ${answers.eventName}`}
                </p>
              )}
              {(answers?.eventName || answers?.eventDate) && (
                <p className="text-sm mt-3 italic" style={{ color: "var(--ink-2)" }}>
                  {isEn
                    ? `We're here to help make ${answers?.eventName || "your next race"} your best race yet. You've got this.`
                    : `Estamos aquí para ayudarte a que ${answers?.eventName || "tu próxima carrera"} sea tu mejor carrera. Vas a ir increíble.`}
                </p>
              )}
            </div>
            <Link href="/mix"><Button variant="ghost" size="sm">{isEn ? "Edit formula" : "Editar fórmula"}</Button></Link>
          </div>

          {showReorderNudge && (
            <div className="mt-6 rounded-2xl p-4 flex items-center justify-between gap-4"
              style={{ background: "#E8946A11", border: "2px solid #E8946A" }}>
              <div>
                <p className="font-semibold text-sm" style={{ color: "var(--ink)" }}>
                  🏁 {isEn ? `${daysToEvent} days to race — ready for race day?` : `${daysToEvent} días para la carrera — ¿listo para el gran día?`}
                </p>
                <p className="text-xs mt-1" style={{ color: "var(--ink-2)" }}>
                  {isEn ? "Build your race nutrition plan and order your Race Day Pack." : "Crea tu plan de nutrición de carrera y pide tu Race Day Pack."}
                </p>
              </div>
              <Link href="/mix" className="shrink-0">
                <Button size="sm">{isEn ? "Plan race →" : "Planear →"}</Button>
              </Link>
            </div>
          )}

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
                    <p className="mt-1 text-xs text-ink-3 italic">{mix.motivationalMessage[locale as "en" | "es"]}</p>
                    <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {([
                        [isEn ? "Carbs" : "Carbos", `${mix.carbsPerServing}g`],
                        [isEn ? "Sodium" : "Sodio", `${mix.sodiumPerServing}mg`],
                        [isEn ? "Caffeine" : "Cafeína", `${mix.caffeinePerServing}mg`],
                        [isEn ? "Ratio" : "Proporción", mix.ratio],
                      ] as [string, string][]).map(([k, v]) => (
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

          {racePlan && (
            <section className="mt-10">
              <p className="text-xs uppercase tracking-widest text-ink-3 mb-4">{isEn ? "Race Day Plan" : "Plan de Carrera"}</p>
              <div className="rounded-2xl border p-6" style={{ background: "var(--surface)", borderColor: "#E8946A55" }}>
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <p className="font-semibold text-sm">{isEn ? "Hour-by-hour nutrition" : "Nutrición hora a hora"}</p>
                    <p className="text-xs text-ink-3 mt-0.5">
                      {racePlan.totalCarbs}g {isEn ? "total carbs" : "carbos totales"} · {racePlan.totalServings} {isEn ? "servings" : "porciones"}
                    </p>
                  </div>
                  <Link href="/mix">
                    <Button variant="ghost" size="sm">{isEn ? "Edit plan" : "Editar plan"}</Button>
                  </Link>
                </div>
                {racePlan.segments.map((seg, i) => (
                  <div key={i} className="flex gap-3 py-3" style={{ borderBottom: i < racePlan.segments.length - 1 ? "1px solid var(--line)" : "none" }}>
                    <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: "#E8946A" }} />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">{seg.label[isEn ? "en" : "es"]}</span>
                        {seg.includeCaffeine && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "#E8946A22", color: "#E8946A" }}>+ caff</span>
                        )}
                      </div>
                      <p className="text-xs mt-0.5 text-ink-3">
                        {seg.durationMinutes}min · {seg.carbsTotal}g · {seg.servings} {isEn ? "servings" : "porciones"}
                      </p>
                      <p className="text-xs italic mt-0.5 text-ink-3">{seg.notes[isEn ? "en" : "es"]}</p>
                    </div>
                  </div>
                ))}
                <div className="mt-4 pt-4 flex gap-3" style={{ borderTop: "1px solid var(--line)" }}>
                  <Link href="/mix">
                    <Button size="sm">{isEn ? "Order Race Day Pack" : "Pedir Race Day Pack"}</Button>
                  </Link>
                </div>
              </div>
            </section>
          )}

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
                    ...(answers.personalBest ? [["PR", answers.personalBest]] : []),
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
                    {answers.eventDate && (
                      <p className="text-xs text-ink-3 mt-0.5">{new Date(answers.eventDate).toLocaleDateString(isEn ? "en-US" : "es")}</p>
                    )}
                  </div>
                )}
                <div className="mt-5 flex gap-3">
                  <Link href="/atleta"><Button variant="ghost" size="sm">{isEn ? "Full profile →" : "Perfil completo →"}</Button></Link>
                  <Link href="/assessment"><Button variant="ghost" size="sm">{isEn ? "Update" : "Actualizar"}</Button></Link>
                </div>
              </div>
            </section>
          )}

          <section className="mt-10">
            <p className="text-xs uppercase tracking-widest text-ink-3 mb-4">{isEn ? "Orders" : "Pedidos"}</p>
            <div className="rounded-2xl border border-line bg-surface-2 p-8 text-center">
              <p className="text-sm text-ink-3">{isEn ? "Order history will appear here after your first purchase." : "El historial de pedidos aparecerá aquí después de tu primera compra."}</p>
              <p className="text-xs text-ink-3 mt-2 italic">
                {isEn ? "Training orders and Race Day Packs will be shown separately." : "Los pedidos de entrenamiento y los Race Day Packs se mostrarán por separado."}
              </p>
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
