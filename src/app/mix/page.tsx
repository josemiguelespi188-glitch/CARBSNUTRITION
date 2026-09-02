"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale } from "@/lib/i18n/context";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { AssessmentAnswers, CustomMix, FormulaRecommendation } from "@/lib/types";
import {
  buildPackRecommendation,
  editWarningCopy,
  getEditWarnings,
} from "@/lib/recommendation";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

type Stage = "formula" | "refine" | "order";

const BRAND_FLAVORS = [
  { key: "peach", en: "Peach", es: "Durazno", color: "#E8946A" },
  { key: "kiwi", en: "Kiwi", es: "Kiwi", color: "#6BAF5E" },
  { key: "pineapple", en: "Pineapple", es: "Piña", color: "#E8C44A" },
  { key: "mango", en: "Mango", es: "Mango", color: "#E8A040" },
];

const PRICE_OPTIONS = [
  { qty: 1, price: 35, servings: 14, save: null },
  { qty: 3, price: 95, servings: 42, save: "9%" },
  { qty: 6, price: 175, servings: 84, save: "17%" },
];

const carbSteps = [25, 50, 75, 100, 125, 150] as const;
const sodiumSteps = [200, 400, 600, 800, 1000] as const;
const caffeineSteps = [0, 25, 50, 75, 100] as const;

export default function MixPage() {
  const { locale } = useLocale();
  const router = useRouter();
  const isEn = locale === "en";

  const [answers, setAnswers] = useState<AssessmentAnswers | null>(null);
  const [mix, setMix] = useState<CustomMix | null>(null);
  const [stage, setStage] = useState<Stage>("formula");
  const [flavorKey, setFlavorKey] = useState("peach");
  const [ctx, setCtx] = useState({ goal: "race", eventName: "", eventDate: "", carbTarget: 60, caffeineGoal: "both" });
  const [qty, setQty] = useState(3);
  const [ordered, setOrdered] = useState(false);

  useEffect(() => {
    const a = sessionStorage.getItem("carbyn:answers");
    const m = sessionStorage.getItem("carbyn:mix");
    const f = sessionStorage.getItem("zenit:flavor");
    if (!a || !m) { router.replace("/assessment"); return; }
    setAnswers(JSON.parse(a));
    setMix(JSON.parse(m));
    if (f && BRAND_FLAVORS.find(x => x.key === f)) setFlavorKey(f);
  }, [router]);

  if (!answers || !mix) return null;

  const flavor = BRAND_FLAVORS.find(f => f.key === flavorKey) ?? BRAND_FLAVORS[0];
  const warnings = getEditWarnings(mix, mix);
  const selectedPrice = PRICE_OPTIONS.find(o => o.qty === qty) ?? PRICE_OPTIONS[1];

  function updateMix<K extends keyof FormulaRecommendation>(key: K, value: FormulaRecommendation[K]) {
    setMix((prev) => {
      if (!prev) return prev;
      const next = { ...prev, [key]: value };
      sessionStorage.setItem("carbyn:mix", JSON.stringify(next));
      return next;
    });
  }

  const STAGES: { key: Stage; en: string; es: string }[] = [
    { key: "formula", en: "Formula", es: "Fórmula" },
    { key: "refine", en: "Refine", es: "Perfeccionar" },
    { key: "order", en: "Order", es: "Cantidad" },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <SiteHeader />
      <main className="flex-1 px-6 pt-28 pb-24">
        <div className="mx-auto max-w-3xl">

          {/* Stage indicator */}
          <div className="flex items-center gap-2 mb-10">
            {STAGES.map((s, i) => (
              <div key={s.key} className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (s.key === "formula") setStage("formula");
                    else if (s.key === "refine" && stage === "order") setStage("refine");
                  }}
                  className={`text-xs uppercase tracking-widest transition-colors ${
                    stage === s.key ? "text-ink font-semibold" : "text-ink-3"
                  }`}
                >
                  {isEn ? s.en : s.es}
                </button>
                {i < STAGES.length - 1 && <span className="text-line text-xs">→</span>}
              </div>
            ))}
          </div>

          {/* STAGE 1: FÓRMULA */}
          {stage === "formula" && (
            <div>
              <div className="flex flex-col lg:flex-row gap-10 items-start">
                {/* Product bag visual */}
                <div className="shrink-0 mx-auto lg:mx-0">
                  <ProductBag flavor={flavor} isEn={isEn} />
                </div>

                {/* Formula data */}
                <div className="flex-1">
                  <p className="text-xs uppercase tracking-[0.4em] text-ink-3">zenit</p>
                  <h1
                    className="mt-2 text-3xl sm:text-4xl font-black uppercase tracking-tight text-ink"
                    style={{ fontFamily: "var(--font-jetbrains-mono, 'JetBrains Mono', monospace)" }}
                  >
                    {(answers.name.split(" ")[0] || answers.name).toUpperCase()}&apos;S FUEL
                  </h1>
                  <p className="mt-2 italic text-ink-3 text-sm">{mix.motivationalMessage[locale]}</p>

                  {/* Formula data table */}
                  <div className="mt-6 divide-y divide-line border-y border-line">
                    {[
                      [isEn ? "Carbohydrates" : "Carbohidratos", `${mix.carbsPerServing} g`],
                      [isEn ? "Sodium" : "Sodio", `${mix.sodiumPerServing} mg`],
                      [isEn ? "Caffeine" : "Cafeína", `${mix.caffeinePerServing} mg`],
                      [isEn ? "Ratio Malto:Fructose" : "Relación Malto:Fructosa", mix.ratio],
                      [isEn ? "Calories/serving" : "Calorías/porción", `${Math.round(mix.carbsPerServing * 4)} kcal`],
                    ].map(([k, v]) => (
                      <div key={k} className="flex items-center justify-between py-3">
                        <span className="text-xs uppercase tracking-widest text-ink-3">{k}</span>
                        <span className="text-sm font-semibold text-ink" style={{ fontFamily: "var(--font-jetbrains-mono, 'JetBrains Mono', monospace)" }}>{v}</span>
                      </div>
                    ))}
                  </div>

                  {/* AI Reasoning */}
                  <div className="mt-6 space-y-2">
                    {mix.reasoning.map((r) => (
                      <p key={r.field} className="text-xs text-ink-3 leading-relaxed">{r.explanation[locale]}</p>
                    ))}
                  </div>
                </div>
              </div>

              {/* Flavor selector */}
              <div className="mt-12">
                <p className="text-xs uppercase tracking-widest text-ink-3 mb-4">
                  {isEn ? "Choose your flavor" : "Elige tu sabor"}
                </p>
                <div className="grid grid-cols-4 gap-3">
                  {BRAND_FLAVORS.map((f) => (
                    <button
                      key={f.key}
                      onClick={() => setFlavorKey(f.key)}
                      className={`flex flex-col items-center gap-2 rounded-2xl border px-3 py-4 transition-all ${
                        flavorKey === f.key ? "border-ink bg-ink text-bg" : "border-line text-ink-2 hover:border-ink-2"
                      }`}
                    >
                      <div className="h-8 w-8 rounded-full ring-1 ring-black/10" style={{ background: f.color }} />
                      <span className="text-xs font-medium">{isEn ? f.en : f.es}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-10 flex justify-end">
                <Button onClick={() => setStage("refine")}>
                  {isEn ? "Refine formula →" : "Perfeccionar →"}
                </Button>
              </div>
            </div>
          )}

          {/* STAGE 2: PERFECCIONAR */}
          {stage === "refine" && (
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-ink">
                {isEn ? "Refine your formula" : "Perfecciona tu fórmula"}
              </h2>
              <p className="mt-1 text-sm text-ink-3">
                {isEn ? "Adjust values and tell us about your race context." : "Ajusta valores y cuéntanos sobre tu contexto de carrera."}
              </p>

              {/* Mix editor */}
              <div className="mt-8 grid gap-5 sm:grid-cols-2">
                <EditorField label={isEn ? "Carbs per serving" : "Carbohidratos por porción"}>
                  <StepSelect value={mix.carbsPerServing} steps={carbSteps} suffix="g" onChange={(v) => updateMix("carbsPerServing", v as FormulaRecommendation["carbsPerServing"])} />
                </EditorField>
                <EditorField label={isEn ? "Sodium per serving" : "Sodio por porción"}>
                  <StepSelect value={mix.sodiumPerServing} steps={sodiumSteps} suffix="mg" onChange={(v) => updateMix("sodiumPerServing", v as FormulaRecommendation["sodiumPerServing"])} />
                </EditorField>
                <EditorField label={isEn ? "Caffeine per serving" : "Cafeína por porción"}>
                  <StepSelect value={mix.caffeinePerServing} steps={caffeineSteps} suffix="mg" onChange={(v) => updateMix("caffeinePerServing", v as FormulaRecommendation["caffeinePerServing"])} />
                </EditorField>
                <EditorField label={isEn ? "Malto:Fructose ratio" : "Proporción Malto:Fructosa"}>
                  <div className="flex gap-2">
                    {(["1:0.8", "2:1"] as const).map((r) => (
                      <button key={r} onClick={() => updateMix("ratio", r)}
                        className={`flex-1 rounded-lg border px-3 py-2 text-sm transition-colors ${mix.ratio === r ? "border-ink bg-ink text-bg font-medium" : "border-line text-ink-2 hover:border-ink-2"}`}>
                        {r}
                      </button>
                    ))}
                  </div>
                </EditorField>
                <EditorField label={isEn ? "Flavor strength" : "Intensidad del sabor"}>
                  <div className="flex gap-2">
                    {(["lite", "regular", "mega"] as const).map((s) => (
                      <button key={s} onClick={() => updateMix("flavorStrength", s)}
                        className={`flex-1 rounded-lg border px-3 py-2 text-sm capitalize transition-colors ${mix.flavorStrength === s ? "border-ink bg-ink text-bg font-medium" : "border-line text-ink-2 hover:border-ink-2"}`}>
                        {s}
                      </button>
                    ))}
                  </div>
                </EditorField>
                <EditorField label={isEn ? "Preservatives" : "Conservadores"}>
                  <div className="flex gap-2">
                    {(["yes", "no"] as const).map((v) => (
                      <button key={v} onClick={() => updateMix("preservatives", v)}
                        className={`flex-1 rounded-lg border px-3 py-2 text-sm transition-colors ${mix.preservatives === v ? "border-ink bg-ink text-bg font-medium" : "border-line text-ink-2 hover:border-ink-2"}`}>
                        {v === "yes" ? (isEn ? "Yes" : "Sí") : (isEn ? "No" : "No")}
                      </button>
                    ))}
                  </div>
                </EditorField>
              </div>

              {warnings.length > 0 && (
                <div className="mt-4 space-y-2">
                  {warnings.map((w) => (
                    <div key={w} className="rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink-2">
                      ⚠️ {editWarningCopy[w][locale]}
                    </div>
                  ))}
                </div>
              )}

              {/* Context questions */}
              <div className="mt-10 pt-10 border-t border-line">
                <p className="text-xs uppercase tracking-widest text-ink-3 mb-6">
                  {isEn ? "Race context" : "Contexto de carrera"}
                </p>
                <div className="space-y-6">
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-ink-3 mb-3">
                      {isEn ? "This formula is for…" : "Esta fórmula es para…"}
                    </label>
                    <div className="flex gap-2">
                      {[
                        { v: "race", en: "Race", es: "Carrera" },
                        { v: "training", en: "Training", es: "Entrenamiento" },
                        { v: "both", en: "Both", es: "Ambos" },
                      ].map((o) => (
                        <button key={o.v} onClick={() => setCtx(c => ({ ...c, goal: o.v }))}
                          className={`flex-1 rounded-lg border px-3 py-2 text-sm transition-colors ${ctx.goal === o.v ? "border-ink bg-ink text-bg font-medium" : "border-line text-ink-2 hover:border-ink-2"}`}>
                          {isEn ? o.en : o.es}
                        </button>
                      ))}
                    </div>
                  </div>

                  {(ctx.goal === "race" || ctx.goal === "both") && (
                    <>
                      <div>
                        <label className="block text-xs uppercase tracking-widest text-ink-3 mb-2">
                          {isEn ? "Event name (optional)" : "Nombre del evento (opcional)"}
                        </label>
                        <input
                          value={ctx.eventName}
                          onChange={e => setCtx(c => ({ ...c, eventName: e.target.value }))}
                          placeholder={isEn ? "e.g. IRONMAN 70.3 Cartagena" : "Ej. IRONMAN 70.3 Cartagena"}
                          className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink placeholder:text-ink-3 focus:border-ink focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs uppercase tracking-widest text-ink-3 mb-2">
                          {isEn ? "Event date (optional)" : "Fecha del evento (opcional)"}
                        </label>
                        <input
                          type="date"
                          value={ctx.eventDate}
                          onChange={e => setCtx(c => ({ ...c, eventDate: e.target.value }))}
                          className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink focus:border-ink focus:outline-none"
                        />
                      </div>
                    </>
                  )}

                  <div>
                    <label className="block text-xs uppercase tracking-widest text-ink-3 mb-2">
                      {isEn ? "Carb target per hour (g)" : "Objetivo de carbohidratos por hora (g)"}
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {[30, 45, 60, 75, 90, 120].map(n => (
                        <button key={n} onClick={() => setCtx(c => ({ ...c, carbTarget: n }))}
                          className={`rounded-lg border px-4 py-2 text-sm transition-colors ${ctx.carbTarget === n ? "border-ink bg-ink text-bg font-medium" : "border-line text-ink-2 hover:border-ink-2"}`}>
                          {n}g
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-widest text-ink-3 mb-3">
                      {isEn ? "Caffeine: one mix or two?" : "¿Cafeína: una mezcla o dos?"}
                    </label>
                    <div className="flex gap-2">
                      {[
                        { v: "race_only", en: "Race only (1 mix)", es: "Solo carrera (1 mezcla)" },
                        { v: "both", en: "Training + Race (2 mixes)", es: "Entrenamiento + Carrera (2 mezclas)" },
                      ].map((o) => (
                        <button key={o.v} onClick={() => setCtx(c => ({ ...c, caffeineGoal: o.v }))}
                          className={`flex-1 rounded-lg border px-3 py-2 text-xs text-left transition-colors ${ctx.caffeineGoal === o.v ? "border-ink bg-ink text-bg font-medium" : "border-line text-ink-2 hover:border-ink-2"}`}>
                          {isEn ? o.en : o.es}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-10 flex items-center justify-between">
                <Button variant="ghost" onClick={() => setStage("formula")}>
                  {isEn ? "← Back" : "← Atrás"}
                </Button>
                <Button onClick={() => setStage("order")}>
                  {isEn ? "See quantity →" : "Ver cantidad →"}
                </Button>
              </div>
            </div>
          )}

          {/* STAGE 3: CANTIDAD Y PAGO */}
          {stage === "order" && (
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-ink">
                {isEn ? "Quantity & order" : "Cantidad y pedido"}
              </h2>

              {/* Order summary card */}
              <div className="mt-8 rounded-2xl border border-line bg-surface p-6">
                <div className="flex items-start gap-6">
                  <div className="shrink-0" style={{ width: 80 }}>
                    <MiniProductBag flavor={flavor} />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs uppercase tracking-widest text-ink-3">zenit</p>
                    <p className="mt-1 text-lg font-black uppercase text-ink" style={{ fontFamily: "var(--font-jetbrains-mono, 'JetBrains Mono', monospace)" }}>
                      {(answers.name.split(" ")[0] || answers.name).toUpperCase()}&apos;S FUEL
                    </p>
                    <p className="mt-1 text-sm text-ink-2">
                      {isEn ? flavor.en : flavor.es} · {mix.carbsPerServing}g carbs · {mix.sodiumPerServing}mg Na · {mix.caffeinePerServing}mg caf
                    </p>
                    {ctx.eventName && (
                      <p className="mt-1 text-xs text-ink-3">
                        {isEn ? "For:" : "Para:"} {ctx.eventName}
                        {ctx.eventDate ? ` · ${new Date(ctx.eventDate).toLocaleDateString(locale === "en" ? "en-US" : "es")}` : ""}
                      </p>
                    )}
                    <p className="mt-2 text-xs text-ink-3">
                      {ctx.caffeineGoal === "both"
                        ? (isEn ? "2 mixes: training (no caf) + race (with caf)" : "2 mezclas: entrenamiento (sin caf) + carrera (con caf)")
                        : (isEn ? "1 mix with caffeine for race" : "1 mezcla con cafeína para carrera")}
                    </p>
                  </div>
                </div>
              </div>

              {/* Quantity options */}
              <div className="mt-10">
                <p className="text-xs uppercase tracking-widest text-ink-3 mb-4">
                  {isEn ? "Select quantity" : "Selecciona cantidad"}
                </p>
                <div className="grid gap-3 sm:grid-cols-3">
                  {PRICE_OPTIONS.map((o) => (
                    <button
                      key={o.qty}
                      onClick={() => setQty(o.qty)}
                      className={`rounded-2xl border p-5 text-left transition-all ${
                        qty === o.qty ? "border-ink bg-ink text-bg" : "border-line hover:border-ink-2"
                      }`}
                    >
                      <p className="text-xs uppercase tracking-widest mb-2" style={{ opacity: qty === o.qty ? 0.6 : 1 }}>
                        {o.qty === 1 ? (isEn ? "Sample" : "Muestra") : o.qty === 3 ? (isEn ? "Monthly" : "Mensual") : (isEn ? "Quarterly" : "Trimestral")}
                      </p>
                      <p className="text-lg font-black" style={{ fontFamily: "var(--font-jetbrains-mono, 'JetBrains Mono', monospace)" }}>
                        {isEn ? `${o.qty} bag${o.qty > 1 ? "s" : ""}` : `${o.qty} bolsa${o.qty > 1 ? "s" : ""}`}
                      </p>
                      <p className="mt-1 text-sm">{o.servings} {isEn ? "servings" : "porciones"}</p>
                      <p className="mt-3 text-xl font-semibold">${o.price}</p>
                      {o.save && (
                        <p className="mt-0.5 text-xs" style={{ opacity: 0.7 }}>
                          {isEn ? `Save ${o.save}` : `Ahorra ${o.save}`}
                        </p>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Event-based suggestion */}
              {ctx.eventDate && (() => {
                const weeks = Math.max(0, Math.ceil((new Date(ctx.eventDate).getTime() - Date.now()) / (7 * 24 * 60 * 60 * 1000)));
                const suggestedBags = Math.max(1, Math.ceil(weeks * (answers.trainingHoursPerWeek / 14)));
                return (
                  <div className="mt-4 rounded-xl border border-line bg-surface-2 px-4 py-3">
                    <p className="text-xs text-ink-2">
                      {isEn
                        ? `Your event is in ${weeks} weeks. Based on your training volume, we suggest ~${suggestedBags} bags.`
                        : `Tu evento es en ${weeks} semanas. Según tu volumen de entrenamiento, sugerimos ~${suggestedBags} bolsas.`}
                    </p>
                  </div>
                );
              })()}

              {/* Price total */}
              <div className="mt-8 rounded-2xl border border-line bg-surface p-6">
                <div className="flex items-baseline justify-between">
                  <span className="text-sm text-ink-2">{isEn ? "Subtotal" : "Subtotal"}</span>
                  <span className="text-2xl font-black text-ink" style={{ fontFamily: "var(--font-jetbrains-mono, 'JetBrains Mono', monospace)" }}>${selectedPrice.price}</span>
                </div>
                <p className="mt-1 text-xs text-ink-3">
                  ${(selectedPrice.price / selectedPrice.servings).toFixed(2)}/{isEn ? "serving" : "porción"} · {isEn ? "Free shipping" : "Envío gratis"}
                </p>
                <div className="mt-6">
                  {ordered ? (
                    <div className="rounded-xl border border-line bg-surface-2 px-5 py-4 text-center">
                      <p className="font-semibold text-ink">{isEn ? "Order received!" : "¡Pedido recibido!"}</p>
                      <p className="mt-1 text-sm text-ink-3">
                        {isEn ? "We’ll be in touch at" : "Te contactaremos en"} {answers.email}
                      </p>
                    </div>
                  ) : (
                    <Button className="w-full" onClick={() => setOrdered(true)}>
                      {isEn ? `Order ${qty} bag${qty > 1 ? "s" : ""} — $${selectedPrice.price}` : `Pedir ${qty} bolsa${qty > 1 ? "s" : ""} — $${selectedPrice.price}`}
                    </Button>
                  )}
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between">
                <Button variant="ghost" onClick={() => setStage("refine")}>
                  {isEn ? "← Back" : "← Atrás"}
                </Button>
                <Link href="/assessment" className="text-xs text-ink-3 underline underline-offset-4 hover:text-ink-2">
                  {isEn ? "Retake assessment" : "Repetir evaluación"}
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function ProductBag({ flavor, isEn }: { flavor: typeof BRAND_FLAVORS[0]; isEn: boolean }) {
  return (
    <div className="relative" style={{ width: 200, height: 300 }}>
      <div
        className="absolute inset-0 rounded-3xl overflow-hidden"
        style={{
          background: "linear-gradient(160deg, #D0D0CE 0%, #EAEAE8 30%, #C0C0BE 60%, #DCDCDA 100%)",
          boxShadow: "0 24px 64px rgba(0,0,0,0.14), inset 0 1px 0 rgba(255,255,255,0.6)",
        }}
      >
        {/* Metallic sheen */}
        <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, transparent 30%, rgba(255,255,255,0.35) 47%, transparent 55%)" }} />

        {/* Content */}
        <div className="relative flex flex-col items-center h-full pb-24 px-6 pt-9">
          {/* Summit mark */}
          <svg width="26" height="22" viewBox="0 0 26 22" fill="none">
            <polyline points="13,2 24,20 2,20" stroke="#0B0B0C" strokeWidth="1.5" strokeLinejoin="round" />
            <circle cx="13" cy="2" r="2.5" fill="#0B0B0C" />
          </svg>

          {/* Wordmark */}
          <p className="mt-2 text-2xl font-black text-[#0B0B0C]" style={{ fontFamily: "JetBrains Mono, monospace", letterSpacing: "0.03em" }}>
            zenit
          </p>
          <p className="text-[7px] uppercase tracking-[0.5em] text-[#55565B] mt-0.5">nutrition</p>

          <div className="mt-5 w-full border-t border-[#0B0B0C]/20" />

          <p className="mt-5 text-sm font-bold uppercase tracking-[0.2em] text-[#0B0B0C]">
            {isEn ? flavor.en : flavor.es}
          </p>
          <p className="mt-1 text-[9px] uppercase tracking-widest text-[#55565B]">33 g · 14 servings</p>
          <p className="mt-0.5 text-[9px] uppercase tracking-widest text-[#55565B]">120 kcal · 30 g carbs</p>
        </div>

        {/* Flavor color panel */}
        <div
          className="absolute bottom-0 inset-x-0 h-24 rounded-b-3xl flex items-center justify-center"
          style={{ background: flavor.color }}
        >
          <p className="text-xs font-bold uppercase tracking-widest text-white/95">
            {isEn ? flavor.en : flavor.es}
          </p>
        </div>
      </div>
    </div>
  );
}

function MiniProductBag({ flavor }: { flavor: typeof BRAND_FLAVORS[0] }) {
  return (
    <div className="relative" style={{ width: 80, height: 112 }}>
      <div
        className="absolute inset-0 rounded-xl overflow-hidden"
        style={{
          background: "linear-gradient(160deg, #D0D0CE 0%, #EAEAE8 35%, #C8C8C6 100%)",
          boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
        }}
      >
        <div className="relative flex flex-col items-center justify-center h-full pb-8 pt-3 px-2">
          <p className="text-[8px] font-black text-[#0B0B0C]" style={{ fontFamily: "JetBrains Mono, monospace" }}>zenit</p>
          <p className="text-[5px] uppercase tracking-[0.4em] text-[#55565B]">nutrition</p>
          <p className="mt-2 text-[7px] font-bold uppercase text-[#0B0B0C]" style={{ letterSpacing: "0.1em" }}>Peach</p>
        </div>
        <div className="absolute bottom-0 inset-x-0 h-8 rounded-b-xl" style={{ background: flavor.color }} />
      </div>
    </div>
  );
}

function EditorField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-2 block text-xs uppercase tracking-widest text-ink-3">{label}</label>
      {children}
    </div>
  );
}

function StepSelect<T extends number>({ value, steps, suffix, onChange }: { value: T; steps: readonly T[]; suffix: string; onChange: (v: T) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {steps.map((s) => (
        <button key={s} onClick={() => onChange(s)}
          className={`rounded-lg border px-3 py-2 text-sm transition-colors ${value === s ? "border-ink bg-ink text-bg font-medium" : "border-line text-ink-2 hover:border-ink-2"}`}>
          {s}{suffix}
        </button>
      ))}
    </div>
  );
}
