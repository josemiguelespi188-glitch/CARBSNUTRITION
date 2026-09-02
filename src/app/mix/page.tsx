"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale } from "@/lib/i18n/context";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { AssessmentAnswers, CustomMix, FormulaRecommendation } from "@/lib/types";
import { assembleCustomMix, editWarningCopy, getEditWarnings } from "@/lib/recommendation";

type Stage = "quiz" | "formula" | "refine" | "quantity" | "order";

const BRAND_FLAVORS = [
  { key: "peach",     en: "Peach",     es: "Durazno", color: "#E8946A" },
  { key: "kiwi",      en: "Kiwi",      es: "Kiwi",    color: "#6BAF5E" },
  { key: "pineapple", en: "Pineapple", es: "Piña",    color: "#E8C44A" },
  { key: "mango",     en: "Mango",     es: "Mango",   color: "#E8A040" },
];

const PRICE_OPTIONS = [
  { qty: 1, price: 35,  servings: 14, discount: null },
  { qty: 3, price: 95,  servings: 42, discount: "9%" },
  { qty: 6, price: 175, servings: 84, discount: "17%" },
];
const RACE_PACK_PRICE = 25;

const DEFAULT_ANSWERS: AssessmentAnswers = {
  name: "", email: "", phone: "",
  sportType: "marathon", goal: "race", trainingHoursPerWeek: 8,
  eventName: "", eventDate: "",
  caffeineTolerance: "medium", caffeineConsumption: "occasional",
  sweatRate: "medium", hotClimateTraining: "no", sodiumIssues: "no",
  digestiveIssues: "no", fructoseTolerance: "normal", sugarSensitivity: "no",
  diabetes: "no", preferredSweetness: "regular",
  flavorPreferences: [], currentNutritionStrategy: "",
  nutritionStrategyItems: [], nutritionStrategyNotes: "",
  caffeineGoal: "both", carbTargetPerHour: 60,
  pastIssuesWithGels: "no", pastIssuesWithSportsDrinks: "no",
};

export default function MixPage() {
  const { locale } = useLocale();
  const router = useRouter();
  const isEn = locale === "en";

  const [stage, setStage] = useState<Stage>("quiz");
  const [quizStep, setQuizStep] = useState(0);
  const [answers, setAnswers] = useState<AssessmentAnswers>(DEFAULT_ANSWERS);
  const [mix, setMix]         = useState<CustomMix | null>(null);
  const [flavorKey, setFlavorKey] = useState("peach");
  const [qty, setQty]     = useState(3);
  const [racePack, setRacePack] = useState(false);
  const [ordered, setOrdered]  = useState(false);

  useEffect(() => {
    try {
      // Restore user identity
      const u = sessionStorage.getItem("zenit:user");
      if (u) {
        const { name, email, phone } = JSON.parse(u) as { name: string; email: string; phone: string };
        setAnswers(p => ({ ...p, name, email, phone }));
      }
      // Pre-selected flavor
      const f = sessionStorage.getItem("zenit:flavor");
      if (f && BRAND_FLAVORS.find(x => x.key === f)) setFlavorKey(f);
      // Existing mix (e.g. returning user)
      const a = sessionStorage.getItem("carbyn:answers");
      const m = sessionStorage.getItem("carbyn:mix");
      if (a && m) {
        const parsedAnswers = JSON.parse(a) as AssessmentAnswers;
        setAnswers(parsedAnswers);
        setMix(JSON.parse(m) as CustomMix);
        setStage("formula"); // skip quiz if we have data
      }
    } catch { /* ignore */ }
  }, []);

  // ─── Quiz helpers ───────────────────────────────────────────────────────────
  const QUIZ = [
    {
      key: "sportType" as const,
      label: { en: "What's your sport?", es: "¿Cuál es tu deporte?" },
      options: [
        { v: "marathon",  en: "Marathon",     es: "Maratón" },
        { v: "ironman",   en: "Ironman",      es: "Ironman" },
        { v: "triathlon", en: "Triathlon",    es: "Triatlón" },
        { v: "cycling",   en: "Cycling",      es: "Ciclismo" },
        { v: "ultra",     en: "Ultra Running",es: "Ultra Running" },
        { v: "trail",     en: "Trail Running",es: "Trail Running" },
        { v: "other",     en: "Other",        es: "Otro" },
      ],
    },
    {
      key: "goal" as const,
      label: { en: "What are you training for right now?", es: "¿Para qué estás entrenando ahora?" },
      options: [
        { v: "race",     en: "An upcoming race",       es: "Una carrera próxima" },
        { v: "training", en: "General training",        es: "Entrenamiento general" },
        { v: "both",     en: "Training + racing season",es: "Entrenamiento y temporada de carreras" },
      ],
    },
    {
      key: "caffeineTolerance" as const,
      label: { en: "Your caffeine tolerance?", es: "¿Tu tolerancia a la cafeína?" },
      options: [
        { v: "none",   en: "None — I avoid it",          es: "Ninguna — lo evito" },
        { v: "low",    en: "Low — sensitive",             es: "Baja — sensible" },
        { v: "medium", en: "Medium — 1–2 cups/day",      es: "Media — 1–2 tazas/día" },
        { v: "high",   en: "High — drink it all day",     es: "Alta — tomo todo el día" },
      ],
    },
  ] as const;

  function quizSelect(v: string) {
    const field = QUIZ[quizStep].key;
    const next = { ...answers, [field]: v, flavorPreferences: [flavorKey] };
    setAnswers(next);
    if (quizStep < QUIZ.length - 1) {
      setQuizStep(s => s + 1);
    } else {
      // Generate initial formula
      const m = assembleCustomMix(next);
      setMix(m);
      try {
        sessionStorage.setItem("carbyn:answers", JSON.stringify(next));
        sessionStorage.setItem("carbyn:mix", JSON.stringify(m));
      } catch { /* ignore */ }
      setStage("formula");
    }
  }

  // ─── Formula / mix editor helpers ─────────────────────────────────────────
  function updateMix<K extends keyof FormulaRecommendation>(key: K, value: FormulaRecommendation[K]) {
    setMix(prev => {
      if (!prev) return prev;
      const next = { ...prev, [key]: value };
      try { sessionStorage.setItem("carbyn:mix", JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  }

  function updateAnswers<K extends keyof AssessmentAnswers>(key: K, value: AssessmentAnswers[K]) {
    setAnswers(prev => {
      const next = { ...prev, [key]: value };
      try { sessionStorage.setItem("carbyn:answers", JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  }

  // When moving from refine → quantity, re-run formula with full profile
  function goToQuantity() {
    const fullAnswers = { ...answers, flavorPreferences: [flavorKey] };
    const refreshed = assembleCustomMix(fullAnswers);
    setMix(refreshed);
    try { sessionStorage.setItem("carbyn:mix", JSON.stringify(refreshed)); } catch { /* ignore */ }
    setStage("quantity");
  }

  const flavor = BRAND_FLAVORS.find(f => f.key === flavorKey) ?? BRAND_FLAVORS[0];
  const warnings = mix ? getEditWarnings(mix, mix) : [];
  const priceOption = PRICE_OPTIONS.find(o => o.qty === qty) ?? PRICE_OPTIONS[1];
  const total = priceOption.price + (racePack ? RACE_PACK_PRICE : 0);
  const firstName = answers.name.split(" ")[0] || answers.name || "Athlete";

  const STAGE_LABELS = [
    { key: "quiz",     en: "Formula",  es: "Fórmula" },
    { key: "formula",  en: "Formula",  es: "Fórmula" },
    { key: "refine",   en: "Refine",   es: "Perfeccionar" },
    { key: "quantity", en: "Quantity", es: "Cantidad" },
    { key: "order",    en: "Order",    es: "Pedido" },
  ] as const;
  const BREADCRUMB = [
    { keys: ["quiz", "formula"] as Stage[], en: "Formula",  es: "Fórmula" },
    { keys: ["refine"] as Stage[],          en: "Refine",   es: "Perfeccionar" },
    { keys: ["quantity"] as Stage[],        en: "Quantity", es: "Cantidad" },
    { keys: ["order"] as Stage[],           en: "Order",    es: "Pedido" },
  ];
  void STAGE_LABELS;

  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <SiteHeader />
      <main className="flex-1 px-6 pt-28 pb-24">
        <div className="mx-auto max-w-3xl">

          {/* Breadcrumb */}
          {stage !== "quiz" && (
            <div className="flex items-center gap-2 mb-10">
              {BREADCRUMB.map((b, i) => {
                const active = b.keys.includes(stage);
                const past = BREADCRUMB.findIndex(x => x.keys.includes(stage)) > i;
                return (
                  <div key={b.en} className="flex items-center gap-2">
                    <span className={`text-xs uppercase tracking-widest ${active ? "text-ink font-semibold" : past ? "text-ink-3" : "text-line"}`}>
                      {isEn ? b.en : b.es}
                    </span>
                    {i < BREADCRUMB.length - 1 && <span className="text-line text-xs">→</span>}
                  </div>
                );
              })}
            </div>
          )}

          {/* ─── STAGE: QUIZ ─────────────────────────────────────────────── */}
          {stage === "quiz" && (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
              <p className="text-xs uppercase tracking-[0.4em] text-ink-3 mb-2">
                {isEn ? `Question ${quizStep + 1} of ${QUIZ.length}` : `Pregunta ${quizStep + 1} de ${QUIZ.length}`}
              </p>
              <div className="mb-3 h-1 w-32 overflow-hidden rounded-full bg-surface-2">
                <div className="h-full bg-ink transition-all duration-300" style={{ width: `${((quizStep + 1) / QUIZ.length) * 100}%` }} />
              </div>
              <h1 className="mt-6 text-2xl sm:text-3xl font-semibold tracking-tight text-ink max-w-lg">
                {QUIZ[quizStep].label[locale]}
              </h1>
              <div className="mt-8 grid gap-3 w-full max-w-md">
                {QUIZ[quizStep].options.map(o => (
                  <button key={o.v} onClick={() => quizSelect(o.v)}
                    className="rounded-2xl border border-line px-5 py-4 text-sm text-ink-2 hover:border-ink hover:text-ink transition-colors text-left">
                    {isEn ? o.en : o.es}
                  </button>
                ))}
              </div>
              {quizStep > 0 && (
                <button className="mt-6 text-xs text-ink-3 underline underline-offset-4 hover:text-ink-2" onClick={() => setQuizStep(s => s - 1)}>
                  {isEn ? "Back" : "Atrás"}
                </button>
              )}
            </div>
          )}

          {/* ─── STAGE: FORMULA ──────────────────────────────────────────── */}
          {stage === "formula" && mix && (
            <div>
              <div className="flex flex-col lg:flex-row gap-10 items-start">
                <div className="shrink-0 mx-auto lg:mx-0">
                  <ProductBag flavor={flavor} isEn={isEn} />
                </div>
                <div className="flex-1">
                  <p className="text-xs uppercase tracking-[0.4em] text-ink-3">zenit</p>
                  <h1 className="mt-2 text-3xl sm:text-4xl font-black uppercase tracking-tight text-ink"
                    style={{ fontFamily: "var(--font-jetbrains-mono,'JetBrains Mono',monospace)" }}>
                    {firstName.toUpperCase()}&apos;S FUEL
                  </h1>
                  <p className="mt-2 italic text-ink-3 text-sm">{mix.motivationalMessage[locale]}</p>
                  <div className="mt-6 divide-y divide-line border-y border-line">
                    {([
                      [isEn ? "Carbohydrates" : "Carbohidratos", `${mix.carbsPerServing} g`],
                      [isEn ? "Sodium" : "Sodio", `${mix.sodiumPerServing} mg`],
                      [isEn ? "Caffeine" : "Cafeína", `${mix.caffeinePerServing} mg`],
                      [isEn ? "Ratio" : "Proporción", mix.ratio],
                      [isEn ? "Calories/serving" : "Calorías/porción", `${Math.round(mix.carbsPerServing * 4)} kcal`],
                    ] as [string, string][]).map(([k, v]) => (
                      <div key={k} className="flex items-center justify-between py-3">
                        <span className="text-xs uppercase tracking-widest text-ink-3">{k}</span>
                        <span className="text-sm font-semibold text-ink" style={{ fontFamily: "var(--font-jetbrains-mono,'JetBrains Mono',monospace)" }}>{v}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-5 space-y-2">
                    {mix.reasoning.map(r => (
                      <p key={r.field} className="text-xs text-ink-3 leading-relaxed">{r.explanation[locale]}</p>
                    ))}
                  </div>
                </div>
              </div>

              {/* Flavor selector */}
              <div className="mt-12">
                <p className="text-xs uppercase tracking-widest text-ink-3 mb-4">{isEn ? "Flavor" : "Sabor"}</p>
                <div className="grid grid-cols-4 gap-3">
                  {BRAND_FLAVORS.map(f => (
                    <button key={f.key} onClick={() => { setFlavorKey(f.key); updateMix("flavor", f.key); }}
                      className={`flex flex-col items-center gap-2 rounded-2xl border px-3 py-4 transition-all ${
                        flavorKey === f.key ? "border-ink bg-ink text-bg" : "border-line text-ink-2 hover:border-ink-2"
                      }`}>
                      <div className="h-8 w-8 rounded-full ring-1 ring-black/10" style={{ background: f.color }} />
                      <span className="text-xs font-medium">{isEn ? f.en : f.es}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-10 flex justify-end">
                <Button onClick={() => setStage("refine")}>{isEn ? "Refine formula →" : "Perfeccionar →"}</Button>
              </div>
            </div>
          )}

          {/* ─── STAGE: REFINE ───────────────────────────────────────────── */}
          {stage === "refine" && mix && (
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-ink">{isEn ? "Refine your formula" : "Perfecciona tu fórmula"}</h2>
              <p className="mt-1 text-sm text-ink-3">{isEn ? "Adjust values and complete your athlete profile." : "Ajusta valores y completa tu perfil de atleta."}</p>

              {/* Formula editor */}
              <div className="mt-8 grid gap-5 sm:grid-cols-2">
                <EF label={isEn ? "Carbs/serving" : "Carbos/porción"}>
                  <SS value={mix.carbsPerServing} steps={[25,50,75,100,125,150] as const} suffix="g" onChange={v => updateMix("carbsPerServing", v as typeof mix.carbsPerServing)} />
                </EF>
                <EF label={isEn ? "Sodium/serving" : "Sodio/porción"}>
                  <SS value={mix.sodiumPerServing} steps={[200,400,600,800,1000] as const} suffix="mg" onChange={v => updateMix("sodiumPerServing", v as typeof mix.sodiumPerServing)} />
                </EF>
                <EF label={isEn ? "Caffeine/serving" : "Cafeína/porción"}>
                  <SS value={mix.caffeinePerServing} steps={[0,25,50,75,100] as const} suffix="mg" onChange={v => updateMix("caffeinePerServing", v as typeof mix.caffeinePerServing)} />
                </EF>
                <EF label={isEn ? "Ratio Malto:Fructose" : "Malto:Fructosa"}>
                  <div className="flex gap-2">
                    {(["1:0.8","2:1"] as const).map(r => (
                      <button key={r} onClick={() => updateMix("ratio", r)}
                        className={`flex-1 rounded-lg border px-3 py-2 text-sm transition-colors ${mix.ratio === r ? "border-ink bg-ink text-bg font-medium" : "border-line text-ink-2 hover:border-ink-2"}`}>{r}</button>
                    ))}
                  </div>
                </EF>
                <EF label={isEn ? "Flavor strength" : "Intensidad"}>
                  <div className="flex gap-2">
                    {(["lite","regular","mega"] as const).map(s => (
                      <button key={s} onClick={() => updateMix("flavorStrength", s)}
                        className={`flex-1 rounded-lg border px-3 py-2 text-sm capitalize transition-colors ${mix.flavorStrength === s ? "border-ink bg-ink text-bg font-medium" : "border-line text-ink-2 hover:border-ink-2"}`}>{s}</button>
                    ))}
                  </div>
                </EF>
                <EF label={isEn ? "Flavor" : "Sabor"}>
                  <div className="flex gap-2 flex-wrap">
                    {BRAND_FLAVORS.map(f => (
                      <button key={f.key} onClick={() => { setFlavorKey(f.key); updateMix("flavor", f.key); }}
                        className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs transition-colors ${flavorKey === f.key ? "border-ink bg-ink text-bg font-medium" : "border-line text-ink-2 hover:border-ink-2"}`}>
                        <span className="h-3 w-3 rounded-full" style={{ background: f.color }} />
                        {isEn ? f.en : f.es}
                      </button>
                    ))}
                  </div>
                </EF>
              </div>

              {warnings.length > 0 && (
                <div className="mt-4 space-y-2">
                  {warnings.map(w => (
                    <div key={w} className="rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink-2">⚠️ {editWarningCopy[w][locale]}</div>
                  ))}
                </div>
              )}

              {/* Athlete profile section */}
              <div className="mt-10 pt-10 border-t border-line">
                <p className="text-xs uppercase tracking-widest text-ink-3 mb-6">{isEn ? "Athlete profile" : "Perfil del atleta"}</p>
                <div className="grid gap-5 sm:grid-cols-2">
                  <EF label={isEn ? "Training hours/week" : "Horas/semana"}>
                    <div className="flex flex-wrap gap-2">
                      {[4,6,8,10,12,15].map(n => (
                        <button key={n} onClick={() => updateAnswers("trainingHoursPerWeek", n)}
                          className={`rounded-lg border px-3 py-2 text-sm transition-colors ${answers.trainingHoursPerWeek === n ? "border-ink bg-ink text-bg font-medium" : "border-line text-ink-2 hover:border-ink-2"}`}>{n}h</button>
                      ))}
                    </div>
                  </EF>
                  <EF label={isEn ? "Daily caffeine" : "Cafeína diaria"}>
                    <div className="grid grid-cols-2 gap-2">
                      {(["none","occasional","daily","heavy"] as const).map(v => (
                        <button key={v} onClick={() => updateAnswers("caffeineConsumption", v)}
                          className={`rounded-lg border px-3 py-2 text-xs transition-colors ${answers.caffeineConsumption === v ? "border-ink bg-ink text-bg font-medium" : "border-line text-ink-2 hover:border-ink-2"}`}>
                          {isEn ? v : { none:"Nada", occasional:"Ocasional", daily:"Diario", heavy:"Mucho" }[v]}
                        </button>
                      ))}
                    </div>
                  </EF>
                  <EF label={isEn ? "Sweat rate" : "Sudoración"}>
                    <div className="flex gap-2">
                      {(["low","medium","high"] as const).map(v => (
                        <button key={v} onClick={() => updateAnswers("sweatRate", v)}
                          className={`flex-1 rounded-lg border px-3 py-2 text-xs transition-colors ${answers.sweatRate === v ? "border-ink bg-ink text-bg font-medium" : "border-line text-ink-2 hover:border-ink-2"}`}>
                          {isEn ? v : { low:"Baja", medium:"Media", high:"Alta" }[v]}
                        </button>
                      ))}
                    </div>
                  </EF>
                  <EF label={isEn ? "Hot climate training?" : "¿Clima caluroso?"}>
                    <YNButtons value={answers.hotClimateTraining} isEn={isEn} onChange={v => updateAnswers("hotClimateTraining", v)} />
                  </EF>
                  <EF label={isEn ? "Cramping or sodium issues?" : "¿Calambres o sodio?"}>
                    <YNButtons value={answers.sodiumIssues} isEn={isEn} onChange={v => updateAnswers("sodiumIssues", v)} />
                  </EF>
                  <EF label={isEn ? "Digestive issues?" : "¿Problemas digestivos?"}>
                    <YNButtons value={answers.digestiveIssues} isEn={isEn} onChange={v => updateAnswers("digestiveIssues", v)} />
                  </EF>
                  {answers.digestiveIssues === "yes" && (
                    <>
                      <EF label={isEn ? "Issues with gels?" : "¿Problemas con geles?"}>
                        <YNButtons value={answers.pastIssuesWithGels} isEn={isEn} onChange={v => updateAnswers("pastIssuesWithGels", v)} />
                      </EF>
                      <EF label={isEn ? "Issues with sports drinks?" : "¿Problemas con bebidas?"}>
                        <YNButtons value={answers.pastIssuesWithSportsDrinks} isEn={isEn} onChange={v => updateAnswers("pastIssuesWithSportsDrinks", v)} />
                      </EF>
                    </>
                  )}
                  <EF label={isEn ? "Fructose tolerance" : "Tolerancia fructosa"}>
                    <div className="flex gap-2">
                      {(["low","normal","high"] as const).map(v => (
                        <button key={v} onClick={() => updateAnswers("fructoseTolerance", v)}
                          className={`flex-1 rounded-lg border px-3 py-2 text-xs transition-colors ${answers.fructoseTolerance === v ? "border-ink bg-ink text-bg font-medium" : "border-line text-ink-2 hover:border-ink-2"}`}>
                          {isEn ? v : { low:"Baja", normal:"Normal", high:"Alta" }[v]}
                        </button>
                      ))}
                    </div>
                  </EF>
                  <EF label={isEn ? "Sugar sensitivity?" : "¿Sensibilidad azúcar?"}>
                    <YNButtons value={answers.sugarSensitivity} isEn={isEn} onChange={v => updateAnswers("sugarSensitivity", v)} />
                  </EF>
                  <EF label={isEn ? "Diabetes?" : "¿Diabetes?"}>
                    <YNButtons value={answers.diabetes} isEn={isEn} onChange={v => updateAnswers("diabetes", v)} />
                  </EF>
                  <EF label={isEn ? "Preferred sweetness" : "Dulzor preferido"}>
                    <div className="flex gap-2">
                      {(["light","regular","intense"] as const).map(v => (
                        <button key={v} onClick={() => updateAnswers("preferredSweetness", v)}
                          className={`flex-1 rounded-lg border px-3 py-2 text-xs capitalize transition-colors ${answers.preferredSweetness === v ? "border-ink bg-ink text-bg font-medium" : "border-line text-ink-2 hover:border-ink-2"}`}>
                          {isEn ? v : { light:"Ligero", regular:"Regular", intense:"Intenso" }[v]}
                        </button>
                      ))}
                    </div>
                  </EF>
                </div>
              </div>

              {/* Race context */}
              <div className="mt-8 pt-8 border-t border-line">
                <p className="text-xs uppercase tracking-widest text-ink-3 mb-6">{isEn ? "Race context" : "Contexto de carrera"}</p>
                <div className="space-y-5">
                  <EF label={isEn ? "This formula is for…" : "Esta fórmula es para…"}>
                    <div className="flex gap-2">
                      {(["race","training","both"] as const).map(v => (
                        <button key={v} onClick={() => updateAnswers("goal", v)}
                          className={`flex-1 rounded-lg border px-3 py-2 text-xs transition-colors ${answers.goal === v ? "border-ink bg-ink text-bg font-medium" : "border-line text-ink-2 hover:border-ink-2"}`}>
                          {isEn ? v : { race:"Carrera", training:"Entrenamiento", both:"Ambos" }[v]}
                        </button>
                      ))}
                    </div>
                  </EF>
                  <EF label={isEn ? "Event name (optional)" : "Evento (opcional)"}>
                    <input value={answers.eventName} onChange={e => updateAnswers("eventName", e.target.value)}
                      placeholder={isEn ? "e.g. IRONMAN 70.3" : "Ej. IRONMAN 70.3"}
                      className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink placeholder:text-ink-3 focus:border-ink focus:outline-none" />
                  </EF>
                  <EF label={isEn ? "Event date (optional)" : "Fecha del evento (opcional)"}>
                    <input type="date" value={answers.eventDate} onChange={e => updateAnswers("eventDate", e.target.value)}
                      className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink focus:border-ink focus:outline-none" />
                  </EF>
                  <EF label={isEn ? "Carbs target per hour (g)" : "Objetivo carbs/hora (g)"}>
                    <div className="flex flex-wrap gap-2">
                      {[30,45,60,75,90,120].map(n => (
                        <button key={n} onClick={() => updateAnswers("carbTargetPerHour", n)}
                          className={`rounded-lg border px-4 py-2 text-sm transition-colors ${answers.carbTargetPerHour === n ? "border-ink bg-ink text-bg font-medium" : "border-line text-ink-2 hover:border-ink-2"}`}>{n}g</button>
                      ))}
                    </div>
                  </EF>
                  <EF label={isEn ? "Caffeine purpose" : "Propósito de la cafeína"}>
                    <div className="grid gap-2">
                      {(["race_only","both","training_only"] as const).map(v => (
                        <button key={v} onClick={() => updateAnswers("caffeineGoal", v)}
                          className={`rounded-lg border px-4 py-2 text-xs text-left transition-colors ${answers.caffeineGoal === v ? "border-ink bg-ink text-bg font-medium" : "border-line text-ink-2 hover:border-ink-2"}`}>
                          {isEn
                            ? { race_only:"Race only — one mix", both:"Training + Race — two mixes", training_only:"No caffeine" }[v]
                            : { race_only:"Solo carrera — una mezcla", both:"Entrenamiento + Carrera — dos mezclas", training_only:"Sin cafeína" }[v]}
                        </button>
                      ))}
                    </div>
                  </EF>
                </div>
              </div>

              <div className="mt-10 flex items-center justify-between">
                <Button variant="ghost" onClick={() => setStage("formula")}>{isEn ? "← Back" : "← Atrás"}</Button>
                <Button onClick={goToQuantity}>{isEn ? "See quantity →" : "Ver cantidad →"}</Button>
              </div>
            </div>
          )}

          {/* ─── STAGE: QUANTITY ─────────────────────────────────────────── */}
          {stage === "quantity" && mix && (
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-ink">{isEn ? "How much do you need?" : "¿Cuánto necesitas?"}</h2>

              {answers.eventDate && (() => {
                const weeks = Math.max(0, Math.ceil((new Date(answers.eventDate).getTime() - Date.now()) / (7 * 24 * 60 * 60 * 1000)));
                const suggested = Math.max(1, Math.ceil(weeks * (answers.trainingHoursPerWeek / 14)));
                return (
                  <div className="mt-4 rounded-xl border border-line bg-surface-2 px-4 py-3">
                    <p className="text-xs text-ink-2">
                      {isEn ? `${weeks} weeks to your event. Based on your training load, we suggest ~${suggested} bags.` : `${weeks} semanas para tu evento. Según tu carga de entrenamiento, sugerimos ~${suggested} bolsas.`}
                    </p>
                  </div>
                );
              })()}

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                {PRICE_OPTIONS.map(o => (
                  <button key={o.qty} onClick={() => setQty(o.qty)}
                    className={`rounded-2xl border p-5 text-left transition-all ${qty === o.qty ? "border-ink bg-ink text-bg" : "border-line hover:border-ink-2"}`}>
                    <p className="text-xs uppercase tracking-widest mb-2" style={{ opacity: qty === o.qty ? 0.6 : 1 }}>
                      {o.qty === 1 ? (isEn ? "Sample" : "Muestra") : o.qty === 3 ? (isEn ? "Monthly" : "Mensual") : (isEn ? "Quarterly" : "Trimestral")}
                    </p>
                    <p className="text-lg font-black" style={{ fontFamily: "var(--font-jetbrains-mono,'JetBrains Mono',monospace)" }}>
                      {isEn ? `${o.qty} bag${o.qty > 1 ? "s" : ""}` : `${o.qty} bolsa${o.qty > 1 ? "s" : ""}`}
                    </p>
                    <p className="mt-1 text-sm">{o.servings} {isEn ? "servings" : "porciones"}</p>
                    <p className="mt-3 text-xl font-semibold">${o.price}</p>
                    {o.discount && <p className="mt-0.5 text-xs" style={{ opacity: 0.7 }}>{isEn ? `Save ${o.discount}` : `Ahorra ${o.discount}`}</p>}
                  </button>
                ))}
              </div>

              <div className="mt-6 text-center text-xs text-ink-3">
                ${(priceOption.price / priceOption.servings).toFixed(2)} / {isEn ? "serving" : "porción"} · {isEn ? "Free shipping" : "Envío gratis"}
              </div>

              <div className="mt-10 flex items-center justify-between">
                <Button variant="ghost" onClick={() => setStage("refine")}>{isEn ? "← Back" : "← Atrás"}</Button>
                <Button onClick={() => setStage("order")}>{isEn ? "See my order →" : "Ver mi pedido →"}</Button>
              </div>
            </div>
          )}

          {/* ─── STAGE: ORDER (Last order view) ─────────────────────────── */}
          {stage === "order" && mix && (
            <div>
              {/* Big product bag + personalization */}
              <div className="flex flex-col lg:flex-row gap-10 items-center lg:items-start">
                <div className="shrink-0">
                  <ProductBag flavor={flavor} isEn={isEn} large />
                </div>
                <div className="flex-1 text-center lg:text-left">
                  <p className="text-xs uppercase tracking-[0.4em] text-ink-3">zenit nutrition</p>
                  <h1 className="mt-3 text-3xl sm:text-5xl font-black uppercase tracking-tight text-ink"
                    style={{ fontFamily: "var(--font-jetbrains-mono,'JetBrains Mono',monospace)" }}>
                    {isEn ? "Personalized for" : "Personalizado para"}
                  </h1>
                  <h2 className="text-3xl sm:text-5xl font-black uppercase text-ink"
                    style={{ fontFamily: "var(--font-jetbrains-mono,'JetBrains Mono',monospace)" }}>
                    {firstName.toUpperCase()}
                  </h2>
                  <p className="mt-5 text-ink-2 italic leading-relaxed max-w-sm">{mix.motivationalMessage[locale]}</p>
                  {answers.eventName && (
                    <p className="mt-3 text-sm text-ink-3">
                      {isEn ? "For:" : "Para:"} <span className="font-medium text-ink">{answers.eventName}</span>
                      {answers.eventDate && ` · ${new Date(answers.eventDate).toLocaleDateString(isEn ? "en-US" : "es")}`}
                    </p>
                  )}
                  <div className="mt-5 inline-flex flex-col gap-1 text-left">
                    {[`${mix.carbsPerServing}g carbs`, `${mix.sodiumPerServing}mg sodium`, `${mix.caffeinePerServing}mg caffeine`, isEn ? flavor.en : flavor.es].map(t => (
                      <span key={t} className="text-xs text-ink-3">· {t}</span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Race Pack offer */}
              <div className="mt-10 rounded-2xl border border-line bg-surface p-6">
                <div className="flex items-start gap-4">
                  <button
                    onClick={() => setRacePack(r => !r)}
                    className={`mt-0.5 h-5 w-5 rounded border-2 shrink-0 flex items-center justify-center transition-colors ${
                      racePack ? "border-ink bg-ink" : "border-line"
                    }`}
                  >
                    {racePack && <svg viewBox="0 0 10 8" fill="none" className="h-3 w-3"><polyline points="1,4 4,7 9,1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                  </button>
                  <div>
                    <p className="font-semibold text-ink">
                      {isEn ? "Add Race Pack" : "Agregar Race Pack"} · <span style={{ fontFamily: "var(--font-jetbrains-mono,'JetBrains Mono',monospace)" }}>${RACE_PACK_PRICE}</span>
                    </p>
                    <p className="mt-1 text-sm text-ink-3">
                      {isEn
                        ? "6 single-serve sachets tuned for race day intensity. Easy to carry, no scooping."
                        : "6 sobres individuales optimizados para la intensidad del día de carrera. Fáciles de llevar, sin cucharas."}
                    </p>
                  </div>
                </div>
              </div>

              {/* Price total */}
              <div className="mt-6 rounded-2xl border border-line bg-surface p-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-ink-2">{qty} {isEn ? `bag${qty > 1 ? "s" : ""}` : `bolsa${qty > 1 ? "s" : ""}`} · {priceOption.servings} {isEn ? "servings" : "porciones"}</span>
                    <span className="text-ink">${priceOption.price}</span>
                  </div>
                  {racePack && (
                    <div className="flex justify-between text-sm">
                      <span className="text-ink-2">Race Pack · 6 sachets</span>
                      <span className="text-ink">${RACE_PACK_PRICE}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm text-ink-3">
                    <span>{isEn ? "Shipping" : "Envío"}</span>
                    <span>{isEn ? "Free" : "Gratis"}</span>
                  </div>
                  <div className="pt-3 border-t border-line flex justify-between">
                    <span className="font-semibold text-ink">{isEn ? "Total" : "Total"}</span>
                    <span className="text-xl font-black text-ink" style={{ fontFamily: "var(--font-jetbrains-mono,'JetBrains Mono',monospace)" }}>${total}</span>
                  </div>
                </div>
                <div className="mt-6">
                  {ordered ? (
                    <div className="rounded-xl border border-line bg-surface-2 px-5 py-4 text-center">
                      <p className="font-semibold text-ink">{isEn ? "Order received!" : "¡Pedido recibido!"}</p>
                      <p className="mt-1 text-sm text-ink-3">{isEn ? "We’ll be in touch at" : "Te contactaremos en"} {answers.email}</p>
                    </div>
                  ) : (
                    <Link href="/checkout">
                      <Button className="w-full">
                        {isEn ? `Pay $${total} →` : `Pagar $${total} →`}
                      </Button>
                    </Link>
                  )}
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between">
                <Button variant="ghost" onClick={() => setStage("quantity")}>{isEn ? "← Back" : "← Atrás"}</Button>
                <Link href="/perfil" className="text-xs text-ink-3 underline underline-offset-4 hover:text-ink-2">
                  {isEn ? "View my profile" : "Ver mi perfil"}
                </Link>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ProductBag({ flavor, isEn, large }: { flavor: { en: string; es: string; color: string }; isEn: boolean; large?: boolean }) {
  const w = large ? 240 : 200;
  const h = large ? 360 : 300;
  return (
    <div className="relative mx-auto lg:mx-0" style={{ width: w, height: h }}>
      <div className="absolute inset-0 rounded-3xl overflow-hidden"
        style={{
          background: "linear-gradient(160deg, #D0D0CE 0%, #EAEAE8 30%, #C0C0BE 60%, #DCDCDA 100%)",
          boxShadow: "0 24px 64px rgba(0,0,0,0.14), inset 0 1px 0 rgba(255,255,255,0.6)",
        }}>
        <div className="absolute inset-0" style={{ background: "linear-gradient(135deg,transparent 30%,rgba(255,255,255,0.35) 47%,transparent 55%)" }} />
        <div className="relative flex flex-col items-center h-full pb-28 px-6 pt-9">
          <svg width="26" height="22" viewBox="0 0 26 22" fill="none">
            <polyline points="13,2 24,20 2,20" stroke="#0B0B0C" strokeWidth="1.5" strokeLinejoin="round" />
            <circle cx="13" cy="2" r="2.5" fill="#0B0B0C" />
          </svg>
          <p className="mt-2 text-2xl font-black text-[#0B0B0C]" style={{ fontFamily: "JetBrains Mono,monospace", letterSpacing: "0.03em" }}>zenit</p>
          <p className="text-[7px] uppercase tracking-[0.5em] text-[#55565B] mt-0.5">nutrition</p>
          <div className="mt-5 w-full border-t border-[#0B0B0C]/20" />
          <p className="mt-5 text-sm font-bold uppercase tracking-[0.2em] text-[#0B0B0C]">{isEn ? flavor.en : flavor.es}</p>
          <p className="mt-1 text-[9px] uppercase tracking-widest text-[#55565B]">33 g · 14 servings</p>
          <p className="mt-0.5 text-[9px] uppercase tracking-widest text-[#55565B]">120 kcal · 30 g carbs</p>
        </div>
        <div className="absolute bottom-0 inset-x-0 rounded-b-3xl flex items-center justify-center" style={{ height: large ? 112 : 96, background: flavor.color }}>
          <p className="text-xs font-bold uppercase tracking-widest text-white/95">{isEn ? flavor.en : flavor.es}</p>
        </div>
      </div>
    </div>
  );
}

function EF({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-2 block text-xs uppercase tracking-widest text-ink-3">{label}</label>
      {children}
    </div>
  );
}

function SS<T extends number>({ value, steps, suffix, onChange }: { value: T; steps: readonly T[]; suffix: string; onChange: (v: T) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {steps.map(s => (
        <button key={s} onClick={() => onChange(s)}
          className={`rounded-lg border px-3 py-2 text-sm transition-colors ${value === s ? "border-ink bg-ink text-bg font-medium" : "border-line text-ink-2 hover:border-ink-2"}`}>
          {s}{suffix}
        </button>
      ))}
    </div>
  );
}

function YNButtons({ value, isEn, onChange }: { value: string; isEn: boolean; onChange: (v: "yes" | "no") => void }) {
  return (
    <div className="flex gap-2">
      {(["yes","no"] as const).map(v => (
        <button key={v} onClick={() => onChange(v)}
          className={`flex-1 rounded-lg border px-3 py-2 text-sm transition-colors ${value === v ? "border-ink bg-ink text-bg font-medium" : "border-line text-ink-2 hover:border-ink-2"}`}>
          {v === "yes" ? (isEn ? "Yes" : "Sí") : (isEn ? "No" : "No")}
        </button>
      ))}
    </div>
  );
}
