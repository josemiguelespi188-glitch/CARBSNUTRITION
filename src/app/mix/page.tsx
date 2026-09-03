"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale } from "@/lib/i18n/context";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { AiPanel } from "@/components/AiPanel";
import {
  AssessmentAnswers, CustomMix, FormulaRecommendation,
  QuantityExtras, RaceDayAnswers, RaceNutritionPlan, RaceSegment,
} from "@/lib/types";
import { assembleCustomMix, buildRecommendation, editWarningCopy, getEditWarnings } from "@/lib/recommendation";

type Stage = "formula" | "refine" | "quantity" | "order";

const BRAND_FLAVORS = [
  { key: "peach",     en: "Peach",     es: "Durazno", color: "#E8946A" },
  { key: "kiwi",      en: "Kiwi",      es: "Kiwi",    color: "#6BAF5E" },
  { key: "pineapple", en: "Pineapple", es: "Piña",    color: "#E8C44A" },
  { key: "mango",     en: "Mango",     es: "Mango",   color: "#E8A040" },
];

const PRICE_OPTIONS = [
  { qty: 1, price: 25,  servings: 30,  discount: null },
  { qty: 3, price: 68,  servings: 90,  discount: "9%" },
  { qty: 6, price: 125, servings: 180, discount: "17%" },
];

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

// ─── Helpers ─────────────────────────────────────────────────────────────────

function estimateRaceHours(sportType: string): number {
  const d: Record<string, number> = {
    marathon: 4, ironman: 11, triathlon: 5.5, cycling: 4, ultra: 10, trail: 7, other: 4,
  };
  return d[sportType] ?? 4;
}

function raceFueledHours(extras: QuantityExtras, sportType: string): number {
  const total = extras.raceGoalHours;
  if ((sportType === "ironman" || sportType === "triathlon") && !extras.fueledDisciplines.includes("swim")) {
    return Math.max(0.5, total * (sportType === "ironman" ? 0.83 : 0.80));
  }
  return total;
}

function buildRacePlan(rda: RaceDayAnswers, extras: QuantityExtras, mix: CustomMix, sportType: string): RaceNutritionPlan {
  const segs: RaceSegment[] = [];
  let totalCarbs = 0;
  let totalServings = 0;
  const cps = mix.carbsPerServing;
  const hasCaff = mix.caffeinePerServing > 0;
  const isMulti = sportType === "ironman" || sportType === "triathlon";

  if (isMulti && rda.swimMinutes > 0 && extras.fueledDisciplines.includes("swim")) {
    const c = Math.round((rda.carbsPerHourRace * rda.swimMinutes) / 60);
    const s = Math.ceil(c / cps);
    segs.push({
      label: { en: "Swim", es: "Natación" },
      durationMinutes: rda.swimMinutes, carbsTotal: c, servings: s, includeCaffeine: false,
      notes: { en: "Gel or chews only — liquid mix impractical in water", es: "Solo gel o gomitas — mezcla líquida no es práctica en el agua" },
    });
    totalCarbs += c; totalServings += s;
  }

  if (isMulti && rda.bikeMinutes > 0) {
    const c = Math.round((rda.carbsPerHourRace * rda.bikeMinutes) / 60);
    const s = Math.ceil(c / cps);
    segs.push({
      label: { en: "Bike", es: "Ciclismo" },
      durationMinutes: rda.bikeMinutes, carbsTotal: c, servings: s, includeCaffeine: false,
      notes: { en: "Mix in bottles — drink every 15–20 min", es: "Mezcla en botellas — bebe cada 15–20 min" },
    });
    totalCarbs += c; totalServings += s;
  }

  const runMins = isMulti ? rda.runMinutes : Math.round(extras.raceGoalHours * 60);
  if (runMins > 0) {
    const half = Math.floor(runMins / 2);
    const c1 = Math.round((rda.carbsPerHourRace * half) / 60);
    const s1 = Math.ceil(c1 / cps);
    segs.push({
      label: { en: isMulti ? "Run — 1st half" : "First half", es: isMulti ? "Carrera — 1ª mitad" : "Primera mitad" },
      durationMinutes: half, carbsTotal: c1, servings: s1, includeCaffeine: false,
      notes: { en: "Build steady fueling rhythm, no caffeine yet", es: "Establece ritmo de combustible, sin cafeína aún" },
    });
    const c2 = Math.round((rda.carbsPerHourRace * (runMins - half)) / 60);
    const s2 = Math.ceil(c2 / cps);
    segs.push({
      label: { en: isMulti ? "Run — 2nd half" : "Second half", es: isMulti ? "Carrera — 2ª mitad" : "Segunda mitad" },
      durationMinutes: runMins - half, carbsTotal: c2, servings: s2, includeCaffeine: hasCaff,
      notes: {
        en: hasCaff ? "Add caffeine for the final push" : "Maintain carb intake through the finish",
        es: hasCaff ? "Agrega cafeína para el empuje final" : "Mantén la ingesta de carbos hasta el final",
      },
    });
    totalCarbs += c1 + c2; totalServings += s1 + s2;
  }

  return { segments: segs, totalCarbs, totalServings, generatedAt: new Date().toISOString() };
}

function getRacePackPrice(totalServings: number): number {
  const tier = PRICE_OPTIONS.find(p => p.servings >= totalServings) ?? PRICE_OPTIONS[PRICE_OPTIONS.length - 1];
  return Math.round(tier.price * 0.7);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

// FlipBag: ziplog SVG bag, front=flavor, back=live nutrition label
function FlipBag({ flavor, mix, isEn, defaultFlipped = false }: {
  flavor: string; mix: CustomMix | null; isEn: boolean; defaultFlipped?: boolean;
}) {
  const [flipped, setFlipped] = useState(defaultFlipped);
  const f = BRAND_FLAVORS.find(x => x.key === flavor) ?? BRAND_FLAVORS[0];
  const darkShade: Record<string, string> = {
    peach: "#A9331A", kiwi: "#4C7A1F", pineapple: "#C89013", mango: "#B23A17",
  };
  const c1 = darkShade[flavor] ?? "#333";
  const c2 = f.color;
  const mono = "'JetBrains Mono', monospace";

  // Nutrition calculations from real product data + live formula values
  const sugars = mix
    ? (mix.ratio === "2:1" ? Math.round(mix.carbsPerServing / 3) : Math.round(mix.carbsPerServing * 0.44))
    : 0;
  const kcal = mix ? mix.carbsPerServing * 4 : 0;

  const nutRows: [string, string][] = mix ? [
    [isEn ? "Energy" : "Energía",          `${kcal} kcal`],
    [isEn ? "Total Fat" : "Grasa Total",    "0 g"],
    [isEn ? "Carbohydrates" : "Carbohidratos", `${mix.carbsPerServing} g`],
    [isEn ? "  Sugars" : "  Azúcares",     `${sugars} g`],
    [isEn ? "  Fiber" : "  Fibra",         "0 g"],
    [isEn ? "Protein" : "Proteína",        "0 g"],
    [isEn ? "Sodium" : "Sodio",            `${mix.sodiumPerServing} mg`],
    ["Potasio",                             "134 mg"],
    ["Calcio",                              "75 mg"],
    ["Magnesio",                            "37 mg"],
    ...(mix.caffeinePerServing > 0
      ? [[isEn ? "Caffeine" : "Cafeína", `${mix.caffeinePerServing} mg`] as [string, string]]
      : []),
  ] : [];

  const boxH = 30 + nutRows.length * 13;

  return (
    <div
      style={{ perspective: 700, width: 200, margin: "0 auto", cursor: "pointer" }}
      onClick={() => setFlipped(prev => !prev)}
      title={isEn ? "Click to flip" : "Click para voltear"}
    >
      <div style={{
        width: 200, height: 280, position: "relative",
        transformStyle: "preserve-3d",
        transition: "transform 0.55s cubic-bezier(0.4,0,0.2,1)",
        transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
      }}>
        {/* Front */}
        <div style={{ position: "absolute", inset: 0, backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}>
          <svg viewBox="0 0 220 300" style={{ width: "100%", height: "100%", display: "block", filter: "drop-shadow(0 8px 20px rgba(0,0,0,0.22))" }}>
            <defs>
              <linearGradient id={`foilF-${flavor}`} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#B9BABC"/><stop offset="30%" stopColor="#EDEDED"/>
                <stop offset="60%" stopColor="#9C9D9F"/><stop offset="100%" stopColor="#D8D9DA"/>
              </linearGradient>
              <clipPath id={`cpF-${flavor}`}><rect x="20" y="66" width="180" height="210" rx="6"/></clipPath>
            </defs>
            <rect x="4" y="4" width="212" height="292" rx="20" fill={`url(#foilF-${flavor})`}/>
            <g stroke="#00000022" strokeWidth="1">
              <line x1="16" y1="18" x2="204" y2="18"/><line x1="16" y1="24" x2="204" y2="24"/>
              <line x1="16" y1="30" x2="204" y2="30"/><line x1="16" y1="36" x2="204" y2="36"/>
            </g>
            <path d="M4 46 L14 40 L14 52 Z" fill="#FFF"/>
            <path d="M216 46 L206 40 L206 52 Z" fill="#FFF"/>
            <g clipPath={`url(#cpF-${flavor})`}>
              <rect x="20" y="66" width="180" height="210" fill={c2}/>
              <path d="M20 66 H72 L96 276 H20 Z" fill={c1}/>
              <path d="M20 250 L60 210 L80 230 L110 190 L160 230 L200 210 L200 276 L20 276 Z" fill="#FFF" opacity="0.14"/>
            </g>
            <rect x="20" y="66" width="180" height="210" rx="6" fill="none" stroke="#FFFFFF33"/>
            <path d="M120 106 L130 90 L134 95 L140 86 L152 106" stroke="#FFF" strokeWidth="2.2" fill="none" strokeLinejoin="round" strokeLinecap="round"/>
            <circle cx="140" cy="87" r="2" stroke="#FFF" strokeWidth="1.6" fill="none"/>
            <text x="120" y="128" fill="#FFF" fontFamily={mono} fontWeight="800" fontSize="22" letterSpacing="-0.5">zenit</text>
            <text x="121" y="140" fill="#FFF" fontFamily={mono} fontSize="6" letterSpacing="2" opacity="0.85">nutrition</text>
            <text fill="#FFF" fontFamily={mono} fontWeight="700" fontSize="12" letterSpacing="2"
                  transform="translate(40,240) rotate(-90)">{f.en.toUpperCase()}</text>
            {mix && (
              <text x="110" y="260" fill="#FFF" fontFamily={mono} fontSize="8" letterSpacing="0.5"
                    textAnchor="middle" opacity="0.75">
                {mix.carbsPerServing}g · {mix.sodiumPerServing}mg Na{mix.caffeinePerServing > 0 ? ` · ${mix.caffeinePerServing}mg caff` : ""}
              </text>
            )}
            <text x="110" y="285" fill="#FFF" fontFamily={mono} fontSize="7" textAnchor="middle" opacity="0.5">
              {isEn ? "click to flip ↻" : "click para voltear ↻"}
            </text>
          </svg>
        </div>

        {/* Back — full nutrition label */}
        <div style={{ position: "absolute", inset: 0, backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden", transform: "rotateY(180deg)" }}>
          <svg viewBox="0 0 220 300" style={{ width: "100%", height: "100%", display: "block", filter: "drop-shadow(0 8px 20px rgba(0,0,0,0.22))" }}>
            <defs>
              <linearGradient id={`foilB-${flavor}`} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#B9BABC"/><stop offset="30%" stopColor="#EDEDED"/>
                <stop offset="60%" stopColor="#9C9D9F"/><stop offset="100%" stopColor="#D8D9DA"/>
              </linearGradient>
              <clipPath id={`cpB-${flavor}`}><rect x="20" y="66" width="180" height="210" rx="6"/></clipPath>
            </defs>
            <rect x="4" y="4" width="212" height="292" rx="20" fill={`url(#foilB-${flavor})`}/>
            <g stroke="#00000022" strokeWidth="1">
              <line x1="16" y1="18" x2="204" y2="18"/><line x1="16" y1="24" x2="204" y2="24"/>
              <line x1="16" y1="30" x2="204" y2="30"/><line x1="16" y1="36" x2="204" y2="36"/>
            </g>
            <path d="M4 46 L14 40 L14 52 Z" fill="#FFF"/>
            <path d="M216 46 L206 40 L206 52 Z" fill="#FFF"/>
            <g clipPath={`url(#cpB-${flavor})`}>
              <rect x="20" y="66" width="180" height="210" fill={c2}/>
              <path d="M20 66 H55 L35 276 H20 Z" fill={c1} opacity="0.55"/>
              <path d="M200 66 H165 L185 276 H200 Z" fill={c1} opacity="0.55"/>
            </g>
            <text x="34" y="83" fill="#FFF" fontFamily={mono} fontSize="5.5" letterSpacing="0.4" opacity="0.9">
              Electrolitos: Mg · Na · K · Ca
            </text>
            {mix && (
              <text x="186" y="83" fill="#FFF" fontFamily={mono} fontSize="5.5" opacity="0.9" textAnchor="end">
                {mix.ratio}
              </text>
            )}
            <rect x="30" y="88" width="160" height={boxH} rx="3" fill="#FFF"/>
            <rect x="30" y="88" width="160" height="17" fill="#111"/>
            <text x="110" y="100" fill="#FFF" fontFamily={mono} fontWeight="700" fontSize="7"
                  letterSpacing="0.2" textAnchor="middle">
              {isEn ? "Nutrition Facts" : "Información Nutricional"}
            </text>
            <line x1="30" y1="105" x2="190" y2="105" stroke="#ccc" strokeWidth="0.5"/>
            {nutRows.map(([label, val], i) => (
              <g key={String(label) + i}>
                <text x="34" y={113 + i * 13} fill="#111" fontFamily={mono} fontSize="6.5">{label}</text>
                <text x="186" y={113 + i * 13} fill="#111" fontFamily={mono} fontSize="6.5" textAnchor="end">{val}</text>
                <line x1="30" y1={116 + i * 13} x2="190" y2={116 + i * 13} stroke="#eee" strokeWidth="0.4"/>
              </g>
            ))}
            <text x="110" y="272" fill="#FFF" fontFamily={mono} fontWeight="800" fontSize="14"
                  letterSpacing="-0.3" textAnchor="middle" opacity="0.95">zenit</text>
            <text x="110" y="285" fill="#FFF" fontFamily={mono} fontSize="7" textAnchor="middle" opacity="0.5">
              {isEn ? "click to flip ↻" : "click para voltear ↻"}
            </text>
          </svg>
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

// ─── Main Page ────────────────────────────────────────────────────────────────

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

  // Addendum state
  const [quantityExtras, setQuantityExtras] = useState<QuantityExtras | null>(null);
  const [quantityStep, setQuantityStep] = useState<"intake" | "main">("intake");
  const [raceDayStep, setRaceDayStep] = useState<"closed" | "form" | "plan">("closed");
  const [racePlan, setRacePlan] = useState<RaceNutritionPlan | null>(null);
  // Intake form local state
  const [raceHours, setRaceHours] = useState(4);
  const [raceMinsInput, setRaceMinsInput] = useState(0);
  const [noGoal, setNoGoal] = useState(false);
  const [fueledDiscs, setFueledDiscs] = useState<string[]>(["bike", "run"]);
  // Race day form local state
  const [rdCarbs, setRdCarbs] = useState(70);
  const [rdClimate, setRdClimate] = useState<RaceDayAnswers["raceClimate"]>("temperate");
  const [rdSwimMin, setRdSwimMin] = useState(70);
  const [rdBikeMin, setRdBikeMin] = useState(360);
  const [rdRunMin, setRdRunMin] = useState(260);
  const [rdAidStations, setRdAidStations] = useState<"yes" | "no">("yes");

  useEffect(() => {
    try {
      const u = sessionStorage.getItem("zenit:user");
      if (u) { const p = JSON.parse(u); setAnswers(prev => ({ ...prev, ...p })); }
      const f = sessionStorage.getItem("zenit:flavor");
      if (f && BRAND_FLAVORS.find(x => x.key === f)) setFlavorKey(f);
      const a = sessionStorage.getItem("carbyn:answers");
      const m = sessionStorage.getItem("carbyn:mix");
      if (a && m) {
        const pa = JSON.parse(a) as AssessmentAnswers;
        setAnswers(pa);
        const pm = JSON.parse(m) as CustomMix;
        setMix(pm);
        if (pm.flavor) {
          const fk = BRAND_FLAVORS.find(x => x.en.toLowerCase() === pm.flavor.toLowerCase() || x.es.toLowerCase() === pm.flavor.toLowerCase());
          if (fk) setFlavorKey(fk.key);
        }
        // Init race day defaults by sport
        if (pa.sportType === "ironman") { setRdSwimMin(70); setRdBikeMin(360); setRdRunMin(260); setRaceHours(11); }
        else if (pa.sportType === "triathlon") { setRdSwimMin(20); setRdBikeMin(90); setRdRunMin(60); setRaceHours(3); }
        else if (pa.sportType === "marathon") { setRaceHours(4); }
        else if (pa.sportType === "cycling") { setRaceHours(4); }
      } else {
        router.replace("/assessment");
      }
      const rp = sessionStorage.getItem("carbyn:racePlan");
      if (rp) { const plan = JSON.parse(rp) as RaceNutritionPlan; setRacePlan(plan); setRaceDayStep("plan"); }
    } catch { /* ignore */ }
  }, [router]);

  const checkRecalc = useCallback((newAnswers: AssessmentAnswers) => {
    if (!mix) return;
    try {
      const newRec = buildRecommendation(newAnswers);
      const changed = newRec.carbsPerServing !== mix.carbsPerServing ||
        newRec.sodiumPerServing !== mix.sodiumPerServing ||
        newRec.caffeinePerServing !== mix.caffeinePerServing;
      if (changed) setSuggestedMix(assembleCustomMix(newAnswers));
      else setSuggestedMix(null);
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
      carbsPerServing:    [25, 50, 75, 100, 125, 150],
      sodiumPerServing:   [200, 400, 600, 800, 1000],
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
  const daysToEvent = eventDate ? Math.max(0, Math.floor((eventDate.getTime() - today.getTime()) / 86400000)) : null;
  const weeksRemaining = daysToEvent !== null ? Math.max(4, Math.round(daysToEvent / 7)) : 8;
  const fueledPerWeek = Math.min(6, Math.max(2, Math.round((answers.trainingHoursPerWeek ?? 8) / 2)));
  const scoopTotal = fueledPerWeek * weeksRemaining;
  const servingsTotal = Math.ceil(scoopTotal / 2);
  const recommendedTier = PRICE_OPTIONS.reduce((best, opt) =>
    opt.servings >= servingsTotal && opt.servings < (best?.servings ?? 9999) ? opt : best,
    PRICE_OPTIONS[PRICE_OPTIONS.length - 1]);

  const priceOpt = PRICE_OPTIONS.find(p => p.qty === qty) ?? PRICE_OPTIONS[1];
  const racePackPrice = racePlan ? getRacePackPrice(racePlan.totalServings) : 18;
  const orderTotal = priceOpt.price + (racePack ? racePackPrice : 0);

  function goCheckout() {
    if (!mix) return;
    const payload = { ...mix, qty, racePack, totalPrice: orderTotal, flavorKey, racePlan };
    sessionStorage.setItem("carbyn:mix", JSON.stringify(payload));
    router.push("/checkout");
  }

  const STAGES: Stage[] = ["formula", "refine", "quantity", "order"];

  if (!mix) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
        <p style={{ color: "var(--ink-3)" }}>{isEn ? "Loading your formula…" : "Cargando tu fórmula…"}</p>
      </div>
    );
  }

  // ── FORMULA ──────────────────────────────────────────────────────────────────
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
              <div className="mb-8">
                <FlipBag flavor={flavorKey} mix={mix} isEn={isEn} />
              </div>
              <div className="mb-6">
                <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--ink-3)" }}>
                  {isEn ? "Flavor" : "Sabor"}
                </p>
                <div className="flex gap-3">
                  {BRAND_FLAVORS.map(fl => (
                    <button key={fl.key} onClick={() => setFlavorKey(fl.key)}
                      className="flex-1 py-2 rounded-xl text-sm font-medium transition-all"
                      style={{ background: fl.color + "22", border: `2px solid ${flavorKey === fl.key ? fl.color : "transparent"}`, color: "var(--ink)" }}>
                      {isEn ? fl.en : fl.es}
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
                    { label: isEn ? "Sodium" : "Sodio",         value: `${mix.sodiumPerServing}mg` },
                    { label: isEn ? "Caffeine" : "Cafeína",     value: `${mix.caffeinePerServing}mg` },
                    { label: isEn ? "Ratio" : "Proporción",     value: mix.ratio },
                    { label: isEn ? "Sweetness" : "Dulzura",    value: mix.flavorStrength },
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

  // ── REFINE ───────────────────────────────────────────────────────────────────
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
            {/* Left — bag + formula editor */}
            <div>
              <h1 className="text-2xl font-bold mb-1">{isEn ? "Refine" : "Perfeccionar"}</h1>
              <p className="text-sm mb-4" style={{ color: "var(--ink-3)" }}>
                {isEn ? "Adjust individual values — the label updates live." : "Ajusta valores individuales — la etiqueta se actualiza en vivo."}
              </p>
              {/* Bag shows nutrition label by default, updates live */}
              <div className="mb-4">
                <FlipBag flavor={flavorKey} mix={mix} isEn={isEn} defaultFlipped={true} />
              </div>
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
            {/* Right — athlete profile + AI */}
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
                  <input type="date" className="w-full mt-1 px-2 py-1 rounded text-sm"
                    style={{ background: "var(--surface-2)", border: "1px solid var(--line)", color: "var(--ink)" }}
                    value={answers.eventDate}
                    onChange={e => updateRefineAnswer("eventDate", e.target.value)} />
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

  // ── QUANTITY — INTAKE STEP ────────────────────────────────────────────────────
  if (stage === "quantity" && (quantityStep === "intake" && !quantityExtras)) {
    const isMulti = answers.sportType === "ironman" || answers.sportType === "triathlon";
    const DISCS = [
      { key: "swim", en: "Swim", es: "Natación" },
      { key: "bike", en: "Bike", es: "Ciclismo" },
      { key: "run",  en: "Run",  es: "Carrera"  },
    ];
    return (
      <div className="min-h-screen flex flex-col" style={{ background: "var(--bg)", color: "var(--ink)" }}>
        <SiteHeader />
        <StageNav stages={STAGES} current={stage} setStage={setStage} isEn={isEn} />
        <div className="flex-1 max-w-xl mx-auto w-full px-4 py-12">
          <h1 className="text-2xl font-bold mb-1">{isEn ? "A bit more about your race" : "Un poco más sobre tu carrera"}</h1>
          <p className="text-sm mb-8" style={{ color: "var(--ink-3)" }}>
            {isEn ? "We'll use this to calculate your exact supply needs." : "Usaremos esto para calcular tu suministro exacto."}
          </p>
          {/* Race goal time */}
          <div className="rounded-2xl p-6 mb-5" style={{ background: "var(--surface)", border: "1px solid var(--line)" }}>
            <p className="text-sm font-semibold mb-3">{isEn ? "Race time goal" : "Meta de tiempo de carrera"}</p>
            <div className="flex items-center gap-3 mb-3">
              <select
                value={raceHours} disabled={noGoal}
                onChange={e => setRaceHours(Number(e.target.value))}
                className="flex-1 px-3 py-2 rounded-lg text-sm"
                style={{ background: "var(--surface-2)", border: "1px solid var(--line)", color: noGoal ? "var(--ink-3)" : "var(--ink)", opacity: noGoal ? 0.5 : 1 }}
              >
                {Array.from({ length: 17 }, (_, i) => i + 1).map(h => (
                  <option key={h} value={h}>{h}h</option>
                ))}
              </select>
              <select
                value={raceMinsInput} disabled={noGoal}
                onChange={e => setRaceMinsInput(Number(e.target.value))}
                className="flex-1 px-3 py-2 rounded-lg text-sm"
                style={{ background: "var(--surface-2)", border: "1px solid var(--line)", color: noGoal ? "var(--ink-3)" : "var(--ink)", opacity: noGoal ? 0.5 : 1 }}
              >
                {[0, 15, 30, 45].map(m => <option key={m} value={m}>{m}m</option>)}
              </select>
            </div>
            <label className="flex items-center gap-2 text-sm" style={{ color: "var(--ink-2)", cursor: "pointer" }}>
              <input type="checkbox" checked={noGoal} onChange={e => setNoGoal(e.target.checked)} className="rounded" />
              {isEn ? "No race time goal yet" : "Todavía no tengo meta de tiempo"}
            </label>
          </div>
          {/* Disciplines (multi-sport only) */}
          {isMulti && (
            <div className="rounded-2xl p-6 mb-5" style={{ background: "var(--surface)", border: "1px solid var(--line)" }}>
              <p className="text-sm font-semibold mb-1">{isEn ? "Where will you use your mix?" : "¿En cuáles disciplinas tomarás tu mezcla?"}</p>
              <p className="text-xs mb-4" style={{ color: "var(--ink-3)" }}>
                {isEn ? "Swim is usually skipped — select what applies to you." : "La natación generalmente no aplica — selecciona lo que corresponda."}
              </p>
              <div className="flex gap-3">
                {DISCS.map(d => {
                  const sel = fueledDiscs.includes(d.key);
                  return (
                    <button key={d.key}
                      className="flex-1 py-3 rounded-xl text-sm font-medium transition-all"
                      style={{ background: sel ? "var(--ink)" : "var(--surface-2)", border: `2px solid ${sel ? "var(--ink)" : "var(--line)"}`, color: sel ? "var(--bg)" : "var(--ink)" }}
                      onClick={() => setFueledDiscs(prev => prev.includes(d.key) ? prev.filter(x => x !== d.key) : [...prev, d.key])}
                    >
                      {isEn ? d.en : d.es}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          <Button className="w-full" onClick={() => {
            const goalHours = noGoal ? estimateRaceHours(answers.sportType) : raceHours + raceMinsInput / 60;
            setQuantityExtras({ raceGoalHours: goalHours, raceGoalHasTarget: !noGoal, fueledDisciplines: isMulti ? fueledDiscs : ["run"] });
            setQuantityStep("main");
          }}>
            {isEn ? "Continue →" : "Continuar →"}
          </Button>
        </div>
      </div>
    );
  }

  // ── QUANTITY — MAIN STEP ──────────────────────────────────────────────────────
  if (stage === "quantity") {
    const extras = quantityExtras ?? { raceGoalHours: estimateRaceHours(answers.sportType), raceGoalHasTarget: false, fueledDisciplines: ["run"] };
    const fueledHours = raceFueledHours(extras, answers.sportType);
    const isMulti = answers.sportType === "ironman" || answers.sportType === "triathlon";
    const CLIMATES: { key: RaceDayAnswers["raceClimate"]; en: string; es: string }[] = [
      { key: "temperate", en: "Temperate", es: "Templado" },
      { key: "hot_humid", en: "Hot & Humid", es: "Caluroso Húmedo" },
      { key: "hot_dry",   en: "Hot & Dry",   es: "Caluroso Seco" },
      { key: "cold",      en: "Cold",        es: "Frío" },
    ];

    return (
      <div className="min-h-screen flex flex-col" style={{ background: "var(--bg)", color: "var(--ink)" }}>
        <SiteHeader />
        <StageNav stages={STAGES} current={stage} setStage={setStage} isEn={isEn} />
        <div className="flex-1 max-w-6xl mx-auto w-full px-4 py-8">
          <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
            <div>
              {/* Big countdown */}
              <div className="rounded-2xl p-6 mb-6" style={{ background: "var(--surface)", border: "1px solid var(--line)" }}>
                <div className="flex items-end gap-4 mb-4">
                  <div>
                    <div className="text-7xl font-black leading-none" style={{ fontFamily: "var(--font-mono)", color: "var(--ink)" }}>
                      {daysToEvent !== null ? daysToEvent : "—"}
                    </div>
                    <div className="text-xs uppercase tracking-[0.3em] mt-1" style={{ color: "var(--ink-3)" }}>
                      {isEn
                        ? `days to ${answers.eventName || "your race"}`
                        : `días para ${answers.eventName || "tu carrera"}`}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 pt-4" style={{ borderTop: "1px solid var(--line)" }}>
                  <div>
                    <div className="text-2xl font-bold" style={{ fontFamily: "var(--font-mono)" }}>{weeksRemaining}</div>
                    <div className="text-[10px] uppercase tracking-widest mt-0.5" style={{ color: "var(--ink-3)" }}>
                      {isEn ? "weeks left" : "semanas"}
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold" style={{ fontFamily: "var(--font-mono)" }}>{fueledPerWeek}×</div>
                    <div className="text-[10px] uppercase tracking-widest mt-0.5" style={{ color: "var(--ink-3)" }}>
                      {isEn ? "fueled/week" : "sesiones/sem"}
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold" style={{ fontFamily: "var(--font-mono)" }}>{fueledHours.toFixed(1)}h</div>
                    <div className="text-[10px] uppercase tracking-widest mt-0.5" style={{ color: "var(--ink-3)" }}>
                      {isEn ? "race fueled" : "carrera activa"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Recommended Supply */}
              <div className="rounded-2xl p-6 mb-4" style={{ background: "var(--surface)", border: "1px solid var(--line)" }}>
                <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "var(--ink-3)" }}>
                  {isEn ? "Recommended Supply" : "Suministro Recomendado"}
                </p>
                <div className="text-sm p-3 rounded-lg" style={{ background: "var(--surface-2)" }}>
                  {isEn
                    ? `${servingsTotal} servings to fuel your training through ${answers.eventName || "your event"}.`
                    : `${servingsTotal} porciones para fueling hasta ${answers.eventName || "tu evento"}.`}
                </div>
              </div>

              {/* Scoop Plan */}
              <div className="rounded-2xl p-6 mb-6" style={{ background: "var(--surface)", border: "1px solid var(--line)" }}>
                <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "var(--ink-3)" }}>
                  {isEn ? "Scoop Plan" : "Plan de Scoops"}
                </p>
                <div className="text-sm space-y-1" style={{ color: "var(--ink-2)" }}>
                  <p>• {fueledPerWeek} {isEn ? "fueled sessions" : "sesiones"} × {weeksRemaining} {isEn ? "weeks" : "semanas"} = {scoopTotal} scoops</p>
                  <p>• {mix.carbsPerServing}g {isEn ? "carbs per serving" : "carbos por porción"}</p>
                  <p>• {isEn ? "Use 1-2 scoops per session depending on duration" : "Usa 1-2 scoops por sesión según la duración"}</p>
                </div>
              </div>

              {/* Price tiers */}
              <div className="grid gap-3 mb-6">
                {PRICE_OPTIONS.map(opt => {
                  const isRec = opt.qty === recommendedTier.qty;
                  const isSel = qty === opt.qty;
                  return (
                    <button key={opt.qty} onClick={() => setQty(opt.qty)}
                      className="text-left p-4 rounded-xl transition-all"
                      style={{
                        background: isSel ? "var(--ink)" : "var(--surface)",
                        border: `2px solid ${isSel ? "var(--ink)" : isRec ? "#E8946A" : "var(--line)"}`,
                        color: isSel ? "var(--bg)" : "var(--ink)",
                      }}>
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-semibold">{opt.qty} {opt.qty === 1 ? (isEn ? "bag" : "bolsa") : (isEn ? "bags" : "bolsas")}</div>
                          <div className="text-sm opacity-70">{opt.servings} {isEn ? "servings" : "porciones"} · ${(opt.price / opt.servings).toFixed(2)}/serving</div>
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

              {/* Race Day Pack cross-sell */}
              {raceDayStep === "closed" && (
                <div
                  className="rounded-2xl p-5 mb-6 cursor-pointer"
                  style={{ background: "#E8946A11", border: "2px solid #E8946A" }}
                  onClick={() => setRaceDayStep("form")}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-sm">🏁 {isEn ? "Race Day Pack — 30% off" : "Race Day Pack — 30% descuento"}</p>
                      <p className="text-xs mt-1" style={{ color: "var(--ink-2)" }}>
                        {isEn
                          ? "We'll calculate your hour-by-hour race nutrition plan."
                          : "Calculamos tu plan de nutrición hora a hora para el día de la carrera."}
                      </p>
                    </div>
                    <span className="text-sm shrink-0 ml-3" style={{ color: "#E8946A" }}>→</span>
                  </div>
                </div>
              )}

              {/* Grupo F — Race Day Form */}
              {raceDayStep === "form" && (
                <div className="rounded-2xl p-6 mb-6" style={{ background: "var(--surface)", border: "2px solid #E8946A" }}>
                  <p className="text-sm font-semibold mb-5">🏁 {isEn ? "Race Day Pack" : "Race Day Pack"}</p>

                  <div className="mb-5">
                    <label className="text-xs uppercase tracking-widest block mb-2" style={{ color: "var(--ink-3)" }}>
                      {isEn ? "Carbs/hour on race day" : "Carbos/hora el día de la carrera"}
                    </label>
                    <div className="text-2xl font-bold mb-2" style={{ fontFamily: "var(--font-mono)" }}>{rdCarbs}g/hr</div>
                    <input type="range" min={40} max={120} step={5} value={rdCarbs}
                      onChange={e => setRdCarbs(Number(e.target.value))}
                      className="w-full accent-current" />
                    <div className="flex justify-between text-xs mt-1" style={{ color: "var(--ink-3)" }}>
                      <span>40g</span><span>120g</span>
                    </div>
                  </div>

                  <div className="mb-5">
                    <label className="text-xs uppercase tracking-widest block mb-2" style={{ color: "var(--ink-3)" }}>
                      {isEn ? "Race climate" : "Clima de la carrera"}
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {CLIMATES.map(cl => (
                        <button key={cl.key}
                          onClick={() => setRdClimate(cl.key)}
                          className="py-2 rounded-lg text-sm transition-all"
                          style={{
                            background: rdClimate === cl.key ? "var(--ink)" : "var(--surface-2)",
                            border: `1px solid ${rdClimate === cl.key ? "var(--ink)" : "var(--line)"}`,
                            color: rdClimate === cl.key ? "var(--bg)" : "var(--ink)",
                          }}>
                          {isEn ? cl.en : cl.es}
                        </button>
                      ))}
                    </div>
                  </div>

                  {isMulti && (
                    <div className="mb-5">
                      <label className="text-xs uppercase tracking-widest block mb-2" style={{ color: "var(--ink-3)" }}>
                        {isEn ? "Estimated segment splits" : "Splits estimados por segmento"}
                      </label>
                      {[
                        { label: isEn ? "Swim (min)" : "Natación (min)", val: rdSwimMin, set: setRdSwimMin },
                        { label: isEn ? "Bike (min)" : "Ciclismo (min)", val: rdBikeMin, set: setRdBikeMin },
                        { label: isEn ? "Run (min)" : "Carrera (min)",  val: rdRunMin,  set: setRdRunMin  },
                      ].map(seg => (
                        <div key={seg.label} className="flex items-center gap-3 mb-2">
                          <label className="text-xs w-32" style={{ color: "var(--ink-2)" }}>{seg.label}</label>
                          <input type="number" min={0} max={600} value={seg.val}
                            onChange={e => seg.set(Number(e.target.value))}
                            className="w-20 px-2 py-1 rounded text-sm text-center"
                            style={{ background: "var(--surface-2)", border: "1px solid var(--line)", color: "var(--ink)" }} />
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mb-6">
                    <label className="text-xs uppercase tracking-widest block mb-2" style={{ color: "var(--ink-3)" }}>
                      {isEn ? "Aid stations available?" : "¿Habrá estaciones de hidratación?"}
                    </label>
                    <div className="flex gap-3">
                      {[{ v: "yes" as const, en: "Yes", es: "Sí" }, { v: "no" as const, en: "No", es: "No" }].map(opt => (
                        <button key={opt.v} onClick={() => setRdAidStations(opt.v)}
                          className="flex-1 py-2 rounded-lg text-sm"
                          style={{
                            background: rdAidStations === opt.v ? "var(--ink)" : "var(--surface-2)",
                            border: `1px solid ${rdAidStations === opt.v ? "var(--ink)" : "var(--line)"}`,
                            color: rdAidStations === opt.v ? "var(--bg)" : "var(--ink)",
                          }}>
                          {isEn ? opt.en : opt.es}
                        </button>
                      ))}
                    </div>
                  </div>

                  <Button className="w-full" onClick={() => {
                    const rda: RaceDayAnswers = {
                      carbsPerHourRace: rdCarbs, raceClimate: rdClimate,
                      swimMinutes: rdSwimMin, bikeMinutes: rdBikeMin, runMinutes: rdRunMin,
                      hasAidStations: rdAidStations,
                    };
                    const plan = buildRacePlan(rda, extras, mix, answers.sportType);
                    setRacePlan(plan);
                    sessionStorage.setItem("carbyn:racePlan", JSON.stringify(plan));
                    setRaceDayStep("plan");
                  }}>
                    {isEn ? "Generate race plan →" : "Generar plan de carrera →"}
                  </Button>
                </div>
              )}

              {/* Race plan timeline */}
              {raceDayStep === "plan" && racePlan && (
                <div className="rounded-2xl p-5 mb-6" style={{ background: "var(--surface)", border: "1px solid #E8946A55" }}>
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--ink-3)" }}>
                      {isEn ? "Race Day Plan" : "Plan de Carrera"}
                    </p>
                    <button className="text-xs" style={{ color: "var(--ink-3)" }} onClick={() => setRaceDayStep("form")}>
                      {isEn ? "Edit" : "Editar"}
                    </button>
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
                        <p className="text-xs mt-0.5" style={{ color: "var(--ink-3)" }}>
                          {seg.durationMinutes}min · {seg.carbsTotal}g · {seg.servings} {isEn ? "servings" : "porciones"}
                        </p>
                        <p className="text-xs italic mt-0.5" style={{ color: "var(--ink-3)" }}>{seg.notes[isEn ? "en" : "es"]}</p>
                      </div>
                    </div>
                  ))}
                  <div className="flex gap-6 mt-3 pt-3" style={{ borderTop: "1px solid var(--line)" }}>
                    <div>
                      <div className="text-lg font-bold" style={{ fontFamily: "var(--font-mono)" }}>{racePlan.totalCarbs}g</div>
                      <div className="text-[10px] uppercase tracking-widest" style={{ color: "var(--ink-3)" }}>{isEn ? "total carbs" : "carbos totales"}</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold" style={{ fontFamily: "var(--font-mono)" }}>{racePlan.totalServings}</div>
                      <div className="text-[10px] uppercase tracking-widest" style={{ color: "var(--ink-3)" }}>{isEn ? "servings" : "porciones"}</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold" style={{ fontFamily: "var(--font-mono)" }}>${getRacePackPrice(racePlan.totalServings)}</div>
                      <div className="text-[10px] uppercase tracking-widest" style={{ color: "#6BAF5E" }}>30% off</div>
                    </div>
                  </div>
                </div>
              )}

              <Button className="w-full" onClick={() => setStage("order")}>
                {isEn ? "Review order →" : "Revisar pedido →"}
              </Button>
            </div>

            {/* Right column */}
            <div className="flex flex-col gap-4">
              <FlipBag flavor={flavorKey} mix={mix} isEn={isEn} />
              <AiPanel stage="quantity" mix={mix} answers={answers} lastEdit={lastEdit} locale={locale as "en" | "es"} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── ORDER ─────────────────────────────────────────────────────────────────────
  const priceOpt2 = PRICE_OPTIONS.find(p => p.qty === qty) ?? PRICE_OPTIONS[1];
  const racePackPrice2 = racePlan ? getRacePackPrice(racePlan.totalServings) : 18;
  const orderTotal2 = priceOpt2.price + (racePack ? racePackPrice2 : 0);

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
            <div className="mb-8">
              <FlipBag flavor={flavorKey} mix={mix} isEn={isEn} />
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
                  <div className="font-medium mt-1">{BRAND_FLAVORS.find(fl => fl.key === flavorKey)?.[isEn ? "en" : "es"] ?? flavorKey}</div>
                </div>
                <div className="col-span-2">
                  <span style={{ color: "var(--ink-3)" }}>{isEn ? "Formula" : "Fórmula"}</span>
                  <div className="font-medium mt-1" style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>
                    {mix.carbsPerServing}g C · {mix.sodiumPerServing}mg Na · {mix.caffeinePerServing}mg Caff
                  </div>
                </div>
              </div>
            </div>

            {/* Race Day Pack toggle */}
            <div
              className="rounded-2xl p-4 mb-4 flex items-center justify-between cursor-pointer"
              style={{ background: "var(--surface)", border: `2px solid ${racePack ? "#E8946A" : "var(--line)"}` }}
              onClick={() => setRacePack(r => !r)}
            >
              <div>
                <div className="font-semibold text-sm">
                  🏁 {isEn ? "Race Day Pack" : "Pack Día de Carrera"} +${racePackPrice2}
                  {racePlan && <span className="ml-2 text-xs" style={{ color: "#6BAF5E" }}>30% off</span>}
                </div>
                <div className="text-xs mt-1" style={{ color: "var(--ink-3)" }}>
                  {racePlan
                    ? `${racePlan.totalServings} ${isEn ? "servings" : "porciones"} · ${racePlan.totalCarbs}g ${isEn ? "total carbs" : "carbos totales"}`
                    : (isEn ? "4 single-serve sachets + gel belt" : "4 sobres monodosis + cinturón de geles")}
                </div>
              </div>
              <div className="w-5 h-5 rounded border-2 flex items-center justify-center shrink-0" style={{ borderColor: racePack ? "#E8946A" : "var(--line)", background: racePack ? "#E8946A" : "transparent" }}>
                {racePack && <span className="text-white text-xs">✓</span>}
              </div>
            </div>

            {/* Pricing */}
            <div className="rounded-2xl p-4 mb-6" style={{ background: "var(--surface)", border: "1px solid var(--line)" }}>
              <div className="flex justify-between text-sm mb-2">
                <span style={{ color: "var(--ink-3)" }}>{qty} {isEn ? "bags" : "bolsas"} · {priceOpt2.servings} {isEn ? "servings" : "porciones"}</span>
                <span>${priceOpt2.price}</span>
              </div>
              {racePack && (
                <div className="flex justify-between text-sm mb-2">
                  <span style={{ color: "var(--ink-3)" }}>{isEn ? "Race Day Pack" : "Pack Carrera"}</span>
                  <span>${racePackPrice2}</span>
                </div>
              )}
              <div className="flex justify-between font-bold pt-2" style={{ borderTop: "1px solid var(--line)" }}>
                <span>Total</span><span>${orderTotal2}</span>
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
  stages: Stage[]; current: Stage; setStage: (s: Stage) => void; isEn: boolean;
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
            }}>
            {i + 1}. {isEn ? labels[s].en : labels[s].es}
          </button>
          {i < stages.length - 1 && <span style={{ color: "var(--line-strong)", margin: "0 2px" }}>›</span>}
        </div>
      ))}
    </div>
  );
}

function ProfileField({ label, value, options, onChange }: {
  label: string; value: string; options: string[]; onChange: (v: string) => void;
}) {
  return (
    <div className="mb-3">
      <label className="text-xs block mb-1" style={{ color: "var(--ink-3)" }}>{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)}
        className="w-full text-xs px-2 py-1 rounded"
        style={{ background: "var(--surface-2)", border: "1px solid var(--line)", color: "var(--ink)" }}>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}
