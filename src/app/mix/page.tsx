"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale } from "@/lib/i18n/context";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { AiPanel } from "@/components/AiPanel";
import { AssessmentAnswers, CustomMix, FormulaRecommendation } from "@/lib/types";
import { assembleCustomMix, buildRecommendation, editWarningCopy, getEditWarnings } from "@/lib/recommendation";

type Stage = "formula" | "refine" | "quantity" | "order";

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

// ─── Sub-components ──────────────────────────────────────────────────────────

function ProductBag({ flavor, mix, mini = false }: { flavor: string; mix: CustomMix | null; mini?: boolean }) {
  const f = BRAND_FLAVORS.find(x => x.key === flavor) ?? BRAND_FLAVORS[0];
  const size = mini ? 120 : 220;
  return (
    <div style={{ width: size, margin: "0 auto" }}>
      <div style={{
        width: size, height: size * 1.4,
        background: "linear-gradient(160deg, #c8c8c8 0%, #f0f0f0 40%, #b0b0b0 100%)",
        borderRadius: mini ? 12 : 20,
        display: "flex", flexDirection: "column",
        overflow: "hidden", boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
        position: "relative",
      }}>
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 8 }}>
          <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: mini ? 14 : 22, letterSpacing: 2, color: "#333" }}>
            zenit
          </span>
        </div>
        {mix && !mini && (
          <div style={{ padding: "4px 8px", textAlign: "center" }}>
            <div style={{ fontSize: 9, color: "#555", fontFamily: "var(--font-mono)" }}>
              {mix.carbsPerServing}g carbs · {mix.sodiumPerServing}mg Na
              {mix.caffeinePerServing > 0 ? ` · ${mix.caffeinePerServing}mg caff` : ""}
            </div>
          </div>
        )}
        <div style={{ height: mini ? 28 : 48, background: f.color, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: mini ? 9 : 13, color: "#fff", letterSpacing: 1 }}>
            {f.en.toUpperCase()}
          </span>
        </div>
      </div>
    </div>
  );
}

function EF({ label, value, onDec, onInc, warn }: {
  label: string; value: string | number; onDec: () => void; onInc: () => void; warn?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-2" style={{ borderBottom: "1px solid var(--line)" }}>
      <span className="text-sm" style={{ color: warn ? "#C41C00" : "var(--ink-2)" }}>{label}</span>
      <div className="flex items-center gap-2">
        <button onClick={onDec} className="w-6 h-6 rounded flex items-center justify-center text-sm" style={{ background: "var(--surface-2)" }}>−</button>
        <span className="text-sm font-mono w-16 text-center" style={{ color: warn ? "#C41C00" : "var(--ink)" }}>{value}</span>
        <button onClick={onInc} className="w-6 h-6 rounded flex items-center justify-center text-sm" style={{ background: "var(--surface-2)" }}>+</button>
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function MixPage() {
  const { locale } = useLocale();
  const router = useRouter();
  const isEn = locale === "en";

  const [stage, setStage] = useState<Stage>("formula");
  const [answers, setAnswers] = useState<AssessmentAnswers>(DEFAULT_ANSWERS);
  const [mix, setMix] = useState<CustomMix | null>(null);
  const [flavorKey, setFlavorKey] = useState("peach");
  const [qty, setQty] = useState(3);
  const [racePack, setRacePack] = useState(false);
  const [ordered, setOrdered] = useState(false);
  const [lastEdit, setLastEdit] = useState<{ field: string; value: unknown } | null>(null);
  const [suggestedMix, setSuggestedMix] = useState<CustomMix | null>(null);

  useEffect(() => {
    try {
      const u = sessionStorage.getItem("zenit:user");
      if (u) {
        const parsed = JSON.parse(u);
        setAnswers(p => ({ ...p, ...parsed }));
      }
      const f = sessionStorage.getItem("zenit:flavor");
      if (f && BRAND_FLAVORS.find(x => x.key === f)) setFlavorKey(f);

      const a = sessionStorage.getItem("carbyn:answers");
      const m = sessionStorage.getItem("carbyn:mix");
      if (a && m) {
        const parsedAnswers = JSON.parse(a) as AssessmentAnswers;
        setAnswers(parsedAnswers);
        const parsedMix = JSON.parse(m) as CustomMix;
        setMix(parsedMix);
        if (parsedMix.flavor) {
          const fk = BRAND_FLAVORS.find(x => x.en.toLowerCase() === parsedMix.flavor.toLowerCase() || x.es.toLowerCase() === parsedMix.flavor.toLowerCase());
          if (fk) setFlavorKey(fk.key);
        }
      } else {
        router.replace("/assessment");
      }
    } catch { /* ignore */ }
  }, [router]);

  const checkRecalc = useCallback((newAnswers: AssessmentAnswers) => {
    if (!mix) return;
    try {
      const newRec = buildRecommendation(newAnswers);
      const changed = (
        newRec.carbsPerServing !== mix.carbsPerServing ||
        newRec.sodiumPerServing !== mix.sodiumPerServing ||
        newRec.caffeinePerServing !== mix.caffeinePerServing
      );
      if (changed) {
        const newMix = assembleCustomMix(newAnswers);
        setSuggestedMix(newMix);
      } else {
        setSuggestedMix(null);
      }
    } catch { /* ignore */ }
  }, [mix]);

  function updateRefineAnswer<K extends keyof AssessmentAnswers>(key: K, val: AssessmentAnswers[K]) {
    const updated = { ...answers, [key]: val };
    setAnswers(updated);
    checkRecalc(updated);
  }

  function editMixField(field: keyof FormulaRecommendation, delta: number) {
    if (!mix) return;
    const steps: Record<string, number[]> = {
      carbsPerServing:  [25, 50, 75, 100, 125, 150],
      sodiumPerServing: [200, 400, 600, 800, 1000],
      caffeinePerServing: [0, 25, 50, 75, 100],
    };
    const arr = steps[field as string];
    if (!arr) return;
    const cur = mix[field] as number;
    const idx = arr.indexOf(cur);
    const next = arr[Math.max(0, Math.min(arr.length - 1, idx + delta))];
    const updated = { ...mix, [field]: next };
    updated.warnings = getEditWarnings(buildRecommendation(answers), updated);
    setMix(updated);
    setLastEdit({ field: field as string, value: next });
    sessionStorage.setItem("carbyn:mix", JSON.stringify(updated));
  }

  const eventDate = answers.eventDate ? new Date(answers.eventDate) : null;
  const today = new Date();
  const daysToEvent = eventDate ? Math.max(0, Math.floor((eventDate.getTime() - today.getTime()) / 86400000)) : 56;
  const weeksRemaining = Math.max(4, Math.round(daysToEvent / 7));
  const fueledPerWeek = Math.min(6, Math.max(2, Math.round((answers.trainingHoursPerWeek ?? 8) / 2)));
  const scoopTotal = fueledPerWeek * weeksRemaining;
  const servingsTotal = Math.ceil(scoopTotal / 2);
  const recommendedTier = PRICE_OPTIONS.reduce((best, opt) => opt.servings >= servingsTotal && opt.servings < (best?.servings ?? 9999) ? opt : best, PRICE_OPTIONS[PRICE_OPTIONS.length - 1]);

  const priceOpt = PRICE_OPTIONS.find(p => p.qty === qty) ?? PRICE_OPTIONS[1];
  const total = priceOpt.price + (racePack ? RACE_PACK_PRICE : 0);

  function goCheckout() {
    if (!mix) return;
    const payload = { ...mix, qty, racePack, totalPrice: total, flavorKey };
    sessionStorage.setItem("carbyn:mix", JSON.stringify(payload));
    router.push("/checkout");
  }

  const STAGES: Stage[] = ["formula", "refine", "quantity", "order"];
  const stageIdx = STAGES.indexOf(stage);

  if (!mix) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
        <p style={{ color: "var(--ink-3)" }}>{isEn ? "Loading your formula…" : "Cargando tu fórmula…"}</p>
      </div>
    );
  }

  if (stage === "formula") {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: "var(--bg)", color: "var(--ink)" }}>
        <SiteHeader />
        <StageNav stages={STAGES} current={stage} setStage={setStage} isEn={isEn} />
        <div className="flex-1 max-w-6xl mx-auto w-full px-4 py-8">
          <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
            <div>
              <h1 className="text-2xl font-bold mb-1">{isEn ? "Your Formula" : "Tu Fórmula"}</h1>
              <p className="text-sm mb-6" style={{ color: "var(--ink-3)" }}>
                {isEn ? "Built from your answers. Review your formula below." : "Construida a partir de tus respuestas. Revisa tu fórmula abajo."}
              </p>
              <div className="flex justify-center mb-8">
                <ProductBag flavor={flavorKey} mix={mix} />
              </div>
              <div className="mb-6">
                <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--ink-3)" }}>
                  {isEn ? "Flavor" : "Sabor"}
                </p>
                <div className="flex gap-3">
                  {BRAND_FLAVORS.map(f => (
                    <button
                      key={f.key}
                      onClick={() => setFlavorKey(f.key)}
                      className="flex-1 py-2 rounded-xl text-sm font-medium transition-all"
                      style={{
                        background: f.color + "22",
                        border: `2px solid ${flavorKey === f.key ? f.color : "transparent"}`,
                        color: "var(--ink)",
                      }}
                    >
                      {isEn ? f.en : f.es}
                    </button>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl p-6 mb-6" style={{ background: "var(--surface)", border: "1px solid var(--line)" }}>
                <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "var(--ink-3)" }}>
                  {isEn ? "Formula per Serving" : "Fórmula por Porción"}
                </p>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: isEn ? "Carbs" : "Carbohidratos", value: `${mix.carbsPerServing}g` },
                    { label: isEn ? "Sodium" : "Sodio", value: `${mix.sodiumPerServing}mg` },
                    { label: isEn ? "Caffeine" : "Cafeína", value: `${mix.caffeinePerServing}mg` },
                    { label: isEn ? "Ratio" : "Proporción", value: mix.ratio },
                    { label: isEn ? "Sweetness" : "Dulzura", value: mix.flavorStrength },
                  ].map(r => (
                    <div key={r.label} className="flex flex-col">
                      <span className="text-xs" style={{ color: "var(--ink-3)" }}>{r.label}</span>
                      <span className="text-lg font-bold" style={{ fontFamily: "var(--font-mono)" }}>{r.value}</span>
                    </div>
                  ))}
                </div>
              </div>
              {mix.reasoning.length > 0 && (
                <div className="rounded-2xl p-4 mb-6" style={{ background: "var(--surface-2)", border: "1px solid var(--line)" }}>
                  <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--ink-3)" }}>
                    {isEn ? "Why these values" : "Por qué estos valores"}
                  </p>
                  {mix.reasoning.map((r, i) => (
                    <p key={i} className="text-sm mb-2" style={{ color: "var(--ink-2)" }}>
                      • {r.explanation[locale as "en" | "es"]}
                    </p>
                  ))}
                </div>
              )}
              <Button className="w-full" onClick={() => setStage("refine")}>
                {isEn ? "Refine your formula →" : "Perfeccionar →"}
              </Button>
            </div>
            <div className="flex flex-col gap-4">
              <AiPanel stage="formula" mix={mix} answers={answers} lastEdit={lastEdit} locale={locale as "en" | "es"} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (stage === "refine") {
    const warnings = mix.warnings ?? [];
    return (
      <div className="min-h-screen flex flex-col" style={{ background: "var(--bg)", color: "var(--ink)" }}>
        <SiteHeader />
        <StageNav stages={STAGES} current={stage} setStage={setStage} isEn={isEn} />
        <div className="flex-1 max-w-6xl mx-auto w-full px-4 py-8">
          {suggestedMix && (
            <div className="mb-6 rounded-xl px-4 py-3 flex items-center justify-between gap-4" style={{ background: "#E8946A22", border: "1px solid #E8946A" }}>
              <p className="text-sm" style={{ color: "var(--ink)" }}>
                {isEn ? "Your profile update suggests new formula values." : "Tu perfil actualizado sugiere nuevos valores de fórmula."}
              </p>
              <div className="flex gap-2 shrink-0">
                <Button variant="secondary" onClick={() => { setMix(suggestedMix); setSuggestedMix(null); }}>
                  {isEn ? "Use suggested" : "Usar sugeridos"}
                </Button>
                <Button variant="ghost" onClick={() => setSuggestedMix(null)}>
                  {isEn ? "Keep mine" : "Mantener"}
                </Button>
              </div>
            </div>
          )}
          <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
            <div>
              <h1 className="text-2xl font-bold mb-1">{isEn ? "Refine" : "Perfeccionar"}</h1>
              <p className="text-sm mb-6" style={{ color: "var(--ink-3)" }}>
                {isEn ? "Adjust individual values if needed." : "Ajusta valores individuales si lo necesitas."}
              </p>
              <div className="rounded-2xl p-6 mb-6" style={{ background: "var(--surface)", border: "1px solid var(--line)" }}>
                <EF
                  label={`${isEn ? "Carbs" : "Carbos"} (g)`}
                  value={`${mix.carbsPerServing}g`}
                  warn={warnings.includes("carbs")}
                  onDec={() => editMixField("carbsPerServing", -1)}
                  onInc={() => editMixField("carbsPerServing", 1)}
                />
                <EF
                  label={`${isEn ? "Sodium" : "Sodio"} (mg)`}
                  value={`${mix.sodiumPerServing}mg`}
                  warn={warnings.includes("sodium")}
                  onDec={() => editMixField("sodiumPerServing", -1)}
                  onInc={() => editMixField("sodiumPerServing", 1)}
                />
                <EF
                  label={`${isEn ? "Caffeine" : "Cafeína"} (mg)`}
                  value={`${mix.caffeinePerServing}mg`}
                  warn={warnings.includes("caffeine")}
                  onDec={() => editMixField("caffeinePerServing", -1)}
                  onInc={() => editMixField("caffeinePerServing", 1)}
                />
                {warnings.length > 0 && (
                  <div className="mt-4 p-3 rounded-lg" style={{ background: "#C41C0011", border: "1px solid #C41C0044" }}>
                    {warnings.map(w => (
                      <p key={w} className="text-xs" style={{ color: "#C41C00" }}>
                        ⚠ {editWarningCopy[w]?.[locale as "en" | "es"]}
                      </p>
                    ))}
                  </div>
                )}
              </div>
              <Button className="w-full" onClick={() => setStage("quantity")}>
                {isEn ? "Calculate quantity →" : "Calcular cantidad →"}
              </Button>
            </div>
            <div className="flex flex-col gap-4">
              <div className="rounded-2xl p-5" style={{ background: "var(--surface)", border: "1px solid var(--line)" }}>
                <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "var(--ink-3)" }}>
                  {isEn ? "Athlete Profile" : "Tu Perfil"}
                </p>
                <p className="text-xs font-semibold mb-2" style={{ color: "var(--ink-2)" }}>ATLETA</p>
                <ProfileField label={isEn ? "Caffeine consumption" : "Consumo de cafeína"} value={answers.caffeineConsumption}
                  options={["none","occasional","daily","heavy"]}
                  onChange={v => updateRefineAnswer("caffeineConsumption", v as AssessmentAnswers["caffeineConsumption"])} />
                <ProfileField label={isEn ? "Sweat rate" : "Tasa de sudoración"} value={answers.sweatRate}
                  options={["low","medium","high"]}
                  onChange={v => updateRefineAnswer("sweatRate", v as AssessmentAnswers["sweatRate"])} />
                <ProfileField label={isEn ? "Hot climate" : "Clima caluroso"} value={answers.hotClimateTraining}
                  options={["yes","no"]}
                  onChange={v => updateRefineAnswer("hotClimateTraining", v as AssessmentAnswers["hotClimateTraining"])} />
                <ProfileField label={isEn ? "Sodium/cramping issues" : "Sodio/calambres"} value={answers.sodiumIssues}
                  options={["yes","no"]}
                  onChange={v => updateRefineAnswer("sodiumIssues", v as AssessmentAnswers["sodiumIssues"])} />
                <ProfileField label={isEn ? "Digestive issues" : "Problemas digestivos"} value={answers.digestiveIssues}
                  options={["yes","no"]}
                  onChange={v => updateRefineAnswer("digestiveIssues", v as AssessmentAnswers["digestiveIssues"])} />
                {answers.digestiveIssues === "yes" && <>
                  <ProfileField label={isEn ? "Issues with gels" : "Problemas con geles"} value={answers.pastIssuesWithGels}
                    options={["yes","no"]}
                    onChange={v => updateRefineAnswer("pastIssuesWithGels", v as AssessmentAnswers["pastIssuesWithGels"])} />
                  <ProfileField label={isEn ? "Issues with drinks" : "Problemas con bebidas"} value={answers.pastIssuesWithSportsDrinks}
                    options={["yes","no"]}
                    onChange={v => updateRefineAnswer("pastIssuesWithSportsDrinks", v as AssessmentAnswers["pastIssuesWithSportsDrinks"])} />
                </> }
                <ProfileField label={isEn ? "Fructose tolerance" : "Tolerancia a fructosa"} value={answers.fructoseTolerance}
                  options={["low","normal","high"]}
                  onChange={v => updateRefineAnswer("fructoseTolerance", v as AssessmentAnswers["fructoseTolerance"])} />
                <ProfileField label={isEn ? "Sugar sensitivity" : "Sensibilidad al azúcar"} value={answers.sugarSensitivity}
                  options={["yes","no"]}
                  onChange={v => updateRefineAnswer("sugarSensitivity", v as AssessmentAnswers["sugarSensitivity"])} />
                <ProfileField label={isEn ? "Sweetness preference" : "Preferencia de dulzura"} value={answers.preferredSweetness}
                  options={["light","regular","intense"]}
                  onChange={v => updateRefineAnswer("preferredSweetness", v as AssessmentAnswers["preferredSweetness"])} />
                <p className="text-xs font-semibold mt-4 mb-2" style={{ color: "var(--ink-2)" }}>META</p>
                <div className="mb-2">
                  <label className="text-xs" style={{ color: "var(--ink-3)" }}>{isEn ? "Event name" : "Nombre del evento"}</label>
                  <input
                    className="w-full mt-1 px-2 py-1 rounded text-sm"
                    style={{ background: "var(--surface-2)", border: "1px solid var(--line)", color: "var(--ink)" }}
                    value={answers.eventName}
                    onChange={e => updateRefineAnswer("eventName", e.target.value)}
                    placeholder={isEn ? "e.g. Boston Marathon" : "ej. Maratón de Boston"}
                  />
                </div>
                <div className="mb-2">
                  <label className="text-xs" style={{ color: "var(--ink-3)" }}>{isEn ? "Event date" : "Fecha del evento"}</label>
                  <input
                    type="date"
                    className="w-full mt-1 px-2 py-1 rounded text-sm"
                    style={{ background: "var(--surface-2)", border: "1px solid var(--line)", color: "var(--ink)" }}
                    value={answers.eventDate}
                    onChange={e => updateRefineAnswer("eventDate", e.target.value)}
                  />
                </div>
                <ProfileField label={isEn ? "Caffeine goal" : "Objetivo de cafeína"} value={answers.caffeineGoal}
                  options={["training_only","race_only","both"]}
                  onChange={v => updateRefineAnswer("caffeineGoal", v as AssessmentAnswers["caffeineGoal"])} />
              </div>
              <AiPanel stage="refine" mix={mix} answers={answers} lastEdit={lastEdit} locale={locale as "en" | "es"} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (stage === "quantity") {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: "var(--bg)", color: "var(--ink)" }}>
        <SiteHeader />
        <StageNav stages={STAGES} current={stage} setStage={setStage} isEn={isEn} />
        <div className="flex-1 max-w-6xl mx-auto w-full px-4 py-8">
          <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
            <div>
              <h1 className="text-2xl font-bold mb-1">{isEn ? "How Much Do You Need?" : "¿Cuánto Necesitas?"}</h1>
              <p className="text-sm mb-6" style={{ color: "var(--ink-3)" }}>
                {isEn ? "Based on your training load and event date." : "Basado en tu carga de entrenamiento y fecha del evento."}
              </p>
              <div className="rounded-2xl p-6 mb-4" style={{ background: "var(--surface)", border: "1px solid var(--line)" }}>
                <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "var(--ink-3)" }}>
                  {isEn ? "Recommended Supply" : "Suministro Recomendado"}
                </p>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div>
                    <div className="text-2xl font-bold" style={{ fontFamily: "var(--font-mono)" }}>{weeksRemaining}</div>
                    <div className="text-xs" style={{ color: "var(--ink-3)" }}>{isEn ? "weeks to event" : "semanas al evento"}</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold" style={{ fontFamily: "var(--font-mono)" }}>{fueledPerWeek}×</div>
                    <div className="text-xs" style={{ color: "var(--ink-3)" }}>{isEn ? "fueled sessions/week" : "sesiones/semana"}</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold" style={{ fontFamily: "var(--font-mono)" }}>{scoopTotal}</div>
                    <div className="text-xs" style={{ color: "var(--ink-3)" }}>{isEn ? "total scoops" : "scoops en total"}</div>
                  </div>
                </div>
                <div className="text-sm p-3 rounded-lg" style={{ background: "var(--surface-2)" }}>
                  {isEn
                    ? `${servingsTotal} servings recommended to fuel your training through ${answers.eventName || "your event"}.`
                    : `${servingsTotal} porciones recomendadas para fueling hasta ${answers.eventName || "tu evento"}.`}
                </div>
              </div>
              <div className="rounded-2xl p-6 mb-6" style={{ background: "var(--surface)", border: "1px solid var(--line)" }}>
                <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "var(--ink-3)" }}>
                  {isEn ? "Scoop Plan" : "Plan de Scoops"}
                </p>
                <div className="text-sm" style={{ color: "var(--ink-2)" }}>
                  <p>• {isEn ? `${fueledPerWeek} fueled sessions × ${weeksRemaining} weeks = ${scoopTotal} scoops` : `${fueledPerWeek} sesiones con combustible × ${weeksRemaining} semanas = ${scoopTotal} scoops`}</p>
                  <p className="mt-1">• {isEn ? `${mix.carbsPerServing}g carbs per serving` : `${mix.carbsPerServing}g carbos por porción`}</p>
                  <p className="mt-1">• {isEn ? "Use 1-2 scoops per session depending on duration" : "Usa 1-2 scoops por sesión según la duración"}</p>
                </div>
              </div>
              <div className="grid gap-3 mb-6">
                {PRICE_OPTIONS.map(opt => {
                  const isRec = opt.qty === recommendedTier.qty;
                  const isSel = qty === opt.qty;
                  return (
                    <button
                      key={opt.qty}
                      onClick={() => setQty(opt.qty)}
                      className="text-left p-4 rounded-xl transition-all"
                      style={{
                        background: isSel ? "var(--ink)" : "var(--surface)",
                        border: `2px solid ${isSel ? "var(--ink)" : isRec ? "#E8946A" : "var(--line)"}`,
                        color: isSel ? "var(--bg)" : "var(--ink)",
                      }}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-semibold">{opt.qty} {opt.qty === 1 ? (isEn ? "bag" : "bolsa") : (isEn ? "bags" : "bolsas")}</div>
                          <div className="text-sm opacity-70">{opt.servings} {isEn ? "servings" : "porciones"}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">${opt.price}</div>
                          {opt.discount && <div className="text-xs" style={{ color: isSel ? "rgba(255,255,255,0.7)" : "#6BAF5E" }}>−{opt.discount}</div>}
                          {isRec && !isSel && <div className="text-xs" style={{ color: "#E8946A" }}>✓ {isEn ? "Recommended" : "Recomendado"}</div>}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
              <Button className="w-full" onClick={() => setStage("order")}>
                {isEn ? "Review order →" : "Revisar pedido →"}
              </Button>
            </div>
            <div>
              <AiPanel stage="quantity" mix={mix} answers={answers} lastEdit={lastEdit} locale={locale as "en" | "es"} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const priceOpt2 = PRICE_OPTIONS.find(p => p.qty === qty) ?? PRICE_OPTIONS[1];
  const orderTotal = priceOpt2.price + (racePack ? RACE_PACK_PRICE : 0);

  if (ordered) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: "var(--bg)", color: "var(--ink)" }}>
        <div className="text-6xl mb-6">✓</div>
        <h2 className="text-2xl font-bold mb-2">{isEn ? "Order placed!" : "¡Pedido realizado!"}</h2>
        <p className="text-center mb-8" style={{ color: "var(--ink-3)" }}>
          {isEn ? "We'll send your custom mix within 3-5 business days." : "Te enviaremos tu mezcla personalizada en 3-5 días hábiles."}
        </p>
        <Link href="/perfil"><Button>{isEn ? "View profile" : "Ver perfil"}</Button></Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg)", color: "var(--ink)" }}>
      <SiteHeader />
      <StageNav stages={STAGES} current={stage} setStage={setStage} isEn={isEn} />
      <div className="flex-1 max-w-6xl mx-auto w-full px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          <div>
            <h1 className="text-2xl font-bold mb-6">{isEn ? "Your Order" : "Tu Pedido"}</h1>
            <div className="flex justify-center mb-8">
              <ProductBag flavor={flavorKey} mix={mix} />
            </div>
            <div className="rounded-2xl p-6 mb-4" style={{ background: "var(--surface)", border: "1px solid var(--line)" }}>
              <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "var(--ink-3)" }}>
                {isEn ? "Personalization" : "Personalización"}
              </p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span style={{ color: "var(--ink-3)" }}>{isEn ? "Name on bag" : "Nombre en bolsa"}</span>
                  <div className="font-medium mt-1">{mix.athleteName || answers.name || "—"}</div>
                </div>
                <div>
                  <span style={{ color: "var(--ink-3)" }}>{isEn ? "Flavor" : "Sabor"}</span>
                  <div className="font-medium mt-1">{BRAND_FLAVORS.find(f => f.key === flavorKey)?.[isEn ? "en" : "es"] ?? flavorKey}</div>
                </div>
                <div className="col-span-2">
                  <span style={{ color: "var(--ink-3)" }}>{isEn ? "Formula" : "Fórmula"}</span>
                  <div className="font-medium mt-1" style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>
                    {mix.carbsPerServing}g C · {mix.sodiumPerServing}mg Na · {mix.caffeinePerServing}mg Caff
                  </div>
                </div>
              </div>
            </div>
            <div
              className="rounded-2xl p-4 mb-6 flex items-center justify-between cursor-pointer"
              style={{ background: "var(--surface)", border: `2px solid ${racePack ? "#E8946A" : "var(--line)"}` }}
              onClick={() => setRacePack(r => !r)}
            >
              <div>
                <div className="font-semibold text-sm">{isEn ? "Race Day Pack" : "Pack Día de Carrera"} +${RACE_PACK_PRICE}</div>
                <div className="text-xs mt-1" style={{ color: "var(--ink-3)" }}>
                  {isEn ? "Includes 4 single-serve sachets + gel belt" : "Incluye 4 sobres monodosis + cinturón de geles"}
                </div>
              </div>
              <div className="w-5 h-5 rounded border-2 flex items-center justify-center" style={{ borderColor: racePack ? "#E8946A" : "var(--line)", background: racePack ? "#E8946A" : "transparent" }}>
                {racePack && <span className="text-white text-xs">✓</span>}
              </div>
            </div>
            <div className="rounded-2xl p-4 mb-6" style={{ background: "var(--surface)", border: "1px solid var(--line)" }}>
              <div className="flex justify-between text-sm mb-2">
                <span style={{ color: "var(--ink-3)" }}>{qty} {isEn ? "bags" : "bolsas"} × ${priceOpt2.price / qty}</span>
                <span>${priceOpt2.price}</span>
              </div>
              {racePack && (
                <div className="flex justify-between text-sm mb-2">
                  <span style={{ color: "var(--ink-3)" }}>{isEn ? "Race Day Pack" : "Pack Carrera"}</span>
                  <span>${RACE_PACK_PRICE}</span>
                </div>
              )}
              <div className="flex justify-between font-bold pt-2" style={{ borderTop: "1px solid var(--line)" }}>
                <span>Total</span>
                <span>${orderTotal}</span>
              </div>
            </div>
            <Button className="w-full" onClick={goCheckout}>
              {isEn ? "Proceed to checkout →" : "Continuar al pago →"}
            </Button>
          </div>
          <div>
            <AiPanel stage="order" mix={mix} answers={answers} lastEdit={lastEdit} locale={locale as "en" | "es"} />
          </div>
        </div>
      </div>
    </div>
  );
}

function StageNav({ stages, current, setStage, isEn }: {
  stages: Stage[];
  current: Stage;
  setStage: (s: Stage) => void;
  isEn: boolean;
}) {
  const labels: Record<Stage, { en: string; es: string }> = {
    formula:  { en: "Formula",  es: "Fórmula" },
    refine:   { en: "Refine",   es: "Perfeccionar" },
    quantity: { en: "Quantity", es: "Cantidad" },
    order:    { en: "Order",    es: "Pedido" },
  };
  const idx = stages.indexOf(current);
  return (
    <div className="flex items-center justify-center gap-0 py-4 px-4" style={{ borderBottom: "1px solid var(--line)" }}>
      {stages.map((s, i) => (
        <div key={s} className="flex items-center">
          <button
            onClick={() => i <= idx && setStage(s)}
            className="text-xs px-3 py-1 rounded-full transition-all"
            style={{
              background: s === current ? "var(--ink)" : "transparent",
              color: s === current ? "var(--bg)" : i < idx ? "var(--ink-2)" : "var(--ink-3)",
              cursor: i <= idx ? "pointer" : "default",
              fontWeight: s === current ? 600 : 400,
            }}
          >
            {i + 1}. {isEn ? labels[s].en : labels[s].es}
          </button>
          {i < stages.length - 1 && <span style={{ color: "var(--line-strong)", margin: "0 2px" }}>›</span>}
        </div>
      ))}
    </div>
  );
}

function ProfileField({ label, value, options, onChange }: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="mb-3">
      <label className="text-xs block mb-1" style={{ color: "var(--ink-3)" }}>{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full text-xs px-2 py-1 rounded"
        style={{ background: "var(--surface-2)", border: "1px solid var(--line)", color: "var(--ink)" }}
      >
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}
