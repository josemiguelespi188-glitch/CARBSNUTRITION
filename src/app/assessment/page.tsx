"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "@/lib/i18n/context";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { AssessmentAnswers, SportType, Goal, Tolerance } from "@/lib/types";
import { assembleCustomMix } from "@/lib/recommendation";

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

const QUESTIONS = [
  {
    key: "sportType",
    label: { en: "What's your primary sport?", es: "¿Cuál es tu deporte principal?" },
    type: "choice",
    options: [
      { v: "marathon",  en: "Marathon",      es: "Maratón" },
      { v: "ironman",   en: "Ironman",       es: "Ironman" },
      { v: "triathlon", en: "Triathlon",     es: "Triatlón" },
      { v: "cycling",   en: "Cycling",       es: "Ciclismo" },
      { v: "ultra",     en: "Ultra Running", es: "Ultra Running" },
      { v: "trail",     en: "Trail Running", es: "Trail Running" },
      { v: "other",     en: "Other",         es: "Otro" },
    ],
  },
  {
    key: "goal",
    label: { en: "What are you training for?", es: "¿Para qué entrenas?" },
    type: "choice",
    options: [
      { v: "race",     en: "An upcoming race",        es: "Una carrera próxima" },
      { v: "training", en: "General training",         es: "Entrenamiento general" },
      { v: "both",     en: "Training + racing season", es: "Entrenamiento y temporada" },
    ],
  },
  {
    key: "trainingHoursPerWeek",
    label: { en: "How many hours per week do you train?", es: "¿Cuántas horas por semana entrenas?" },
    type: "slider",
    min: 2, max: 30, step: 1, unit: "h",
  },
  {
    key: "carbTargetPerHour",
    label: { en: "Carbs per hour goal (g)", es: "Meta de carbohidratos por hora (g)" },
    sublabel: { en: "How many grams of carbs per hour do you typically aim for?", es: "¿Cuántos gramos de carbohidratos por hora sueles buscar?" },
    type: "slider",
    min: 30, max: 120, step: 5, unit: "g/h",
  },
  {
    key: "caffeineTolerance",
    label: { en: "How well do you tolerate caffeine?", es: "¿Qué tan bien toleras la cafeína?" },
    type: "choice",
    options: [
      { v: "none",   en: "Can't have it",   es: "No puedo tomarlo" },
      { v: "low",    en: "A little is fine", es: "Un poco está bien" },
      { v: "medium", en: "Moderate",         es: "Moderado" },
      { v: "high",   en: "I love caffeine",  es: "Me encanta la cafeína" },
    ],
  },
  {
    key: "sweatRate",
    label: { en: "How much do you sweat?", es: "¿Cuánto sudas?" },
    type: "choice",
    options: [
      { v: "low",    en: "Light sweater",    es: "Sudo poco" },
      { v: "medium", en: "Average",           es: "Normal" },
      { v: "high",   en: "Heavy sweater",    es: "Sudo mucho" },
    ],
  },
  {
    key: "hotClimateTraining",
    label: { en: "Do you often train in hot weather?", es: "¿Entrenas frecuentemente en clima caluroso?" },
    type: "yesno",
  },
  {
    key: "sodiumIssues",
    label: { en: "Do you get cramps or feel dizzy from sodium loss?", es: "¿Sufres calambres o mareos por pérdida de sodio?" },
    type: "yesno",
  },
] as const;

export default function AssessmentPage() {
  const { locale } = useLocale();
  const router = useRouter();
  const isEn = locale === "en";

  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<AssessmentAnswers>(DEFAULT_ANSWERS);
  const [sliderVal, setSliderVal] = useState<Record<string, number>>({
    trainingHoursPerWeek: 8,
    carbTargetPerHour: 60,
  });

  useEffect(() => {
    try {
      const u = sessionStorage.getItem("zenit:user");
      if (u) {
        const { name, email, phone } = JSON.parse(u);
        setAnswers(p => ({ ...p, name, email, phone }));
      }
      const f = sessionStorage.getItem("zenit:flavor");
      if (f) setAnswers(p => ({ ...p, flavorPreferences: [f] }));
    } catch { /* ignore */ }
  }, []);

  const q = QUESTIONS[step];
  const total = QUESTIONS.length;

  function pick(key: string, val: unknown) {
    setAnswers(p => ({ ...p, [key]: val }));
    if (step < total - 1) {
      setTimeout(() => setStep(s => s + 1), 180);
    } else {
      finish({ ...answers, [key]: val });
    }
  }

  function finishSlider() {
    const key = q.key as string;
    const val = sliderVal[key];
    const updated = { ...answers, [key]: val };
    setAnswers(updated);
    if (step < total - 1) setStep(s => s + 1);
    else finish(updated);
  }

  function finish(finalAnswers: AssessmentAnswers) {
    try {
      const mix = assembleCustomMix(finalAnswers);
      sessionStorage.setItem("carbyn:answers", JSON.stringify(finalAnswers));
      sessionStorage.setItem("carbyn:mix", JSON.stringify(mix));
    } catch { /* ignore */ }
    router.push("/mix");
  }

  const progress = ((step) / total) * 100;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg)", color: "var(--ink)" }}>
      <SiteHeader />
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        {/* Progress */}
        <div className="w-full max-w-lg mb-8">
          <div className="flex justify-between text-xs mb-2" style={{ color: "var(--ink-3)" }}>
            <span>{isEn ? "Your Formula" : "Tu Fórmula"}</span>
            <span>{step + 1} / {total}</span>
          </div>
          <div className="h-1 rounded-full" style={{ background: "var(--line)" }}>
            <div className="h-1 rounded-full transition-all duration-500" style={{ width: `${progress}%`, background: "var(--ink)" }} />
          </div>
        </div>

        {/* Question card */}
        <div className="w-full max-w-lg rounded-2xl p-8" style={{ background: "var(--surface)", border: "1px solid var(--line)" }}>
          <h2 className="text-xl font-semibold mb-2">{q.label[locale as "en" | "es"] ?? q.label.es}</h2>
          {"sublabel" in q && q.sublabel && (
            <p className="text-sm mb-6" style={{ color: "var(--ink-2)" }}>{q.sublabel[locale as "en" | "es"] ?? q.sublabel.es}</p>
          )}

          {q.type === "choice" && "options" in q && (
            <div className="grid grid-cols-1 gap-3 mt-4">
              {q.options.map((opt) => (
                <button
                  key={opt.v}
                  onClick={() => pick(q.key, opt.v)}
                  className="text-left px-4 py-3 rounded-xl transition-all"
                  style={{
                    background: "var(--surface-2)",
                    border: "1px solid var(--line)",
                    color: "var(--ink)",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--ink-2)")}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--line)")}
                >
                  {isEn ? opt.en : opt.es}
                </button>
              ))}
            </div>
          )}

          {q.type === "slider" && "min" in q && (
            <div className="mt-6">
              <div className="text-4xl font-bold mb-4" style={{ fontFamily: "var(--font-mono)" }}>
                {sliderVal[q.key as string] ?? (q.key === "trainingHoursPerWeek" ? 8 : 60)}
                <span className="text-lg font-normal ml-1" style={{ color: "var(--ink-3)" }}>{q.unit}</span>
              </div>
              <input
                type="range"
                min={q.min}
                max={q.max}
                step={q.step}
                value={sliderVal[q.key as string] ?? (q.key === "trainingHoursPerWeek" ? 8 : 60)}
                onChange={e => setSliderVal(p => ({ ...p, [q.key as string]: Number(e.target.value) }))}
                className="w-full accent-current"
              />
              <div className="flex justify-between text-xs mt-1" style={{ color: "var(--ink-3)" }}>
                <span>{q.min}{q.unit}</span><span>{q.max}{q.unit}</span>
              </div>
              <Button className="w-full mt-6" onClick={finishSlider}>
                {isEn ? "Continue →" : "Continuar →"}
              </Button>
            </div>
          )}

          {q.type === "yesno" && (
            <div className="grid grid-cols-2 gap-3 mt-6">
              {[
                { v: "yes", en: "Yes", es: "Sí" },
                { v: "no",  en: "No",  es: "No" },
              ].map(opt => (
                <button
                  key={opt.v}
                  onClick={() => pick(q.key, opt.v)}
                  className="px-4 py-4 rounded-xl text-lg font-medium transition-all"
                  style={{ background: "var(--surface-2)", border: "1px solid var(--line)", color: "var(--ink)" }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--ink-2)")}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--line)")}
                >
                  {isEn ? opt.en : opt.es}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Back */}
        {step > 0 && (
          <button
            className="mt-4 text-sm"
            style={{ color: "var(--ink-3)" }}
            onClick={() => setStep(s => s - 1)}
          >
            ← {isEn ? "Back" : "Regresar"}
          </button>
        )}
      </div>
    </div>
  );
}
