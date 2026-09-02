"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "@/lib/i18n/context";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { AssessmentAnswers } from "@/lib/types";
import { assembleCustomMix } from "@/lib/recommendation";
import { createClient } from "@/lib/supabase/client";
import { PhoneInput } from "@/components/PhoneInput";

const todayISO = () => new Date().toISOString().split("T")[0];

const FLAVOR_NAMES: Record<string, { en: string; es: string }> = {
  peach: { en: "Peach", es: "Durazno" },
  kiwi: { en: "Kiwi", es: "Kiwi" },
  pineapple: { en: "Pineapple", es: "Piña" },
  mango: { en: "Mango", es: "Mango" },
};

const FLAVOR_COLORS: Record<string, string> = {
  peach: "#E8946A",
  kiwi: "#6BAF5E",
  pineapple: "#E8C44A",
  mango: "#E8A040",
};

const initialAnswers: AssessmentAnswers = {
  name: "", email: "", phone: "+1 ",
  sportType: "marathon", goal: "race", trainingHoursPerWeek: 6,
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

type Field<K extends keyof AssessmentAnswers> = {
  key: K;
  label: { en: string; es: string };
  type: "text" | "email" | "phone" | "number" | "date" | "single" | "multi";
  options?: { value: string; label: { en: string; es: string } }[];
  showIf?: (a: AssessmentAnswers) => boolean;
};

const sportOptions = [
  { value: "marathon", label: { en: "Marathon", es: "Maratón" } },
  { value: "ironman", label: { en: "Ironman", es: "Ironman" } },
  { value: "triathlon", label: { en: "Triathlon", es: "Triatlón" } },
  { value: "cycling", label: { en: "Cycling", es: "Ciclismo" } },
  { value: "ultra", label: { en: "Ultra Running", es: "Ultra Running" } },
  { value: "trail", label: { en: "Trail Running", es: "Trail Running" } },
  { value: "other", label: { en: "Other", es: "Otro" } },
];
const toleranceOptions = [
  { value: "none", label: { en: "None", es: "Ninguna" } },
  { value: "low", label: { en: "Low", es: "Baja" } },
  { value: "medium", label: { en: "Medium", es: "Media" } },
  { value: "high", label: { en: "High", es: "Alta" } },
];
const yesNo = [
  { value: "yes", label: { en: "Yes", es: "Sí" } },
  { value: "no", label: { en: "No", es: "No" } },
];

const fields: Field<keyof AssessmentAnswers>[] = [
  { key: "name", label: { en: "What's your name?", es: "¿Cuál es tu nombre?" }, type: "text" },
  { key: "email", label: { en: "Your email", es: "Tu correo electrónico" }, type: "email" },
  { key: "phone", label: { en: "Your phone number", es: "Tu número de teléfono" }, type: "phone" },
  { key: "sportType", label: { en: "What's your sport?", es: "¿Cuál es tu deporte?" }, type: "single", options: sportOptions },
  { key: "trainingHoursPerWeek", label: { en: "Hours of training per week?", es: "¿Horas de entrenamiento por semana?" }, type: "number" },
  { key: "caffeineConsumption", label: { en: "How much caffeine do you consume daily?", es: "¿Cuánta cafeína consumes diariamente?" }, type: "single", options: [
    { value: "none", label: { en: "None", es: "Nada" } },
    { value: "occasional", label: { en: "Occasional (1 cup or less)", es: "Ocasional (1 taza o menos)" } },
    { value: "daily", label: { en: "Daily (2–3 cups)", es: "Diario (2–3 tazas)" } },
    { value: "heavy", label: { en: "Heavy (4+ cups)", es: "Alto (4+ tazas)" } },
  ] },
  { key: "caffeineTolerance", label: { en: "Your caffeine tolerance?", es: "¿Tu tolerancia a la cafeína?" }, type: "single", options: toleranceOptions },
  { key: "sweatRate", label: { en: "Your sweat rate?", es: "¿Tu tasa de sudoración?" }, type: "single", options: [
    { value: "low", label: { en: "Low — barely sweat", es: "Baja — casi no sudo" } },
    { value: "medium", label: { en: "Medium — average", es: "Media — normal" } },
    { value: "high", label: { en: "High — heavy sweater / salt stains", es: "Alta — sudo mucho / manchas de sal" } },
  ] },
  { key: "hotClimateTraining", label: { en: "Do you train or race in hot/humid climates?", es: "¿Entrenas o compites en climas calurosos o húmedos?" }, type: "single", options: yesNo },
  { key: "sodiumIssues", label: { en: "Had cramping or sodium-related issues?", es: "¿Has tenido calambres o problemas de sodio?" }, type: "single", options: yesNo },
  { key: "digestiveIssues", label: { en: "GI (digestive) issues during training or racing?", es: "¿Problemas digestivos durante entrenos o carreras?" }, type: "single", options: yesNo },
  { key: "pastIssuesWithGels", label: { en: "Have gels caused problems in the past?", es: "¿Los geles te han causado problemas?" }, type: "single", options: yesNo, showIf: (a) => a.digestiveIssues === "yes" },
  { key: "pastIssuesWithSportsDrinks", label: { en: "Have sports drinks caused problems?", es: "¿Las bebidas deportivas te han causado problemas?" }, type: "single", options: yesNo, showIf: (a) => a.digestiveIssues === "yes" },
  { key: "fructoseTolerance", label: { en: "How well do you tolerate fructose (fruit sugars)?", es: "¿Qué tan bien toleras la fructosa?" }, type: "single", options: [
    { value: "low", label: { en: "Low — fruit upsets my stomach", es: "Baja — la fruta me cae mal" } },
    { value: "normal", label: { en: "Normal", es: "Normal" } },
    { value: "high", label: { en: "High — no issues at all", es: "Alta — no tengo problemas" } },
  ] },
  { key: "sugarSensitivity", label: { en: "Any sugar sensitivity?", es: "¿Alguna sensibilidad al azúcar?" }, type: "single", options: yesNo },
  { key: "diabetes", label: { en: "Diabetes or pre-diabetes?", es: "¿Diabetes o prediabetes?" }, type: "single", options: yesNo },
  { key: "preferredSweetness", label: { en: "Preferred sweetness level?", es: "¿Nivel de dulzor preferido?" }, type: "single", options: [
    { value: "light", label: { en: "Light", es: "Ligero" } },
    { value: "regular", label: { en: "Regular", es: "Regular" } },
    { value: "intense", label: { en: "Intense", es: "Intenso" } },
  ] },
];

export default function AssessmentPage() {
  const { locale } = useLocale();
  const router = useRouter();
  const isEn = locale === "en";
  const [answers, setAnswers] = useState<AssessmentAnswers>(initialAnswers);
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [preFlavorKey, setPreFlavorKey] = useState<string | null>(null);

  useEffect(() => {
    try {
      const f = sessionStorage.getItem("zenit:flavor");
      if (f) {
        setPreFlavorKey(f);
        setAnswers(prev => ({ ...prev, flavorPreferences: [f] }));
      }
    } catch { /* ignore */ }
  }, []);

  const visibleFields = useMemo(
    () => fields.filter((f) => !f.showIf || f.showIf(answers)),
    [answers]
  );

  const current = visibleFields[step];
  const progress = Math.round(((step + 1) / visibleFields.length) * 100);

  function update<K extends keyof AssessmentAnswers>(key: K, value: AssessmentAnswers[K]) {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  }

  function isValid(): boolean {
    if (!current) return true;
    const value = answers[current.key];
    if (current.type === "multi") return Array.isArray(value);
    if (current.type === "number") return typeof value === "number" && !Number.isNaN(value) && (value as number) > 0;
    return value !== "" && value !== undefined && value !== null;
  }

  async function handleNext() {
    if (step < visibleFields.length - 1) { setStep((s) => s + 1); return; }
    await finish();
  }

  function handleBack() {
    if (step > 0) setStep((s) => s - 1);
  }

  async function finish() {
    setSubmitting(true);
    const mix = assembleCustomMix(answers);
    try {
      const supabase = createClient();
      const { data: assessment } = await supabase.from("assessments").insert({ name: answers.name, email: answers.email, phone: answers.phone, answers }).select("id").single();
      if (assessment?.id) await supabase.from("recommendations").insert({ assessment_id: assessment.id, formula: mix });
    } catch { /* Supabase not configured */ }
    sessionStorage.setItem("carbyn:answers", JSON.stringify(answers));
    sessionStorage.setItem("carbyn:mix", JSON.stringify(mix));
    router.push("/mix");
  }

  if (!current) return null;

  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <SiteHeader />
      <main className="flex flex-1 flex-col items-center justify-center px-6 pt-28 pb-16">
        <div className="w-full max-w-xl">

          {/* Pre-selected flavor banner */}
          {preFlavorKey && FLAVOR_NAMES[preFlavorKey] && (
            <div className="mb-6 flex items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-3">
              <div className="h-6 w-6 rounded-full shrink-0" style={{ background: FLAVOR_COLORS[preFlavorKey] }} />
              <p className="text-sm text-ink-2">
                {isEn ? "Flavor selected:" : "Sabor seleccionado:"}
                {" "}<span className="font-medium text-ink">{isEn ? FLAVOR_NAMES[preFlavorKey].en : FLAVOR_NAMES[preFlavorKey].es}</span>
              </p>
            </div>
          )}

          <div className="mb-8 h-1 w-full overflow-hidden rounded-full bg-surface-2">
            <div className="h-full bg-ink transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
          <p className="mb-2 text-xs uppercase tracking-[0.3em] text-ink-3">
            {isEn ? `Step ${step + 1} of ${visibleFields.length}` : `Paso ${step + 1} de ${visibleFields.length}`}
          </p>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-ink">{current.label[locale]}</h1>
          <div className="mt-8">
            <FieldInput field={current} answers={answers} onChange={(v) => update(current.key, v as never)} locale={locale} />
          </div>
          <div className="mt-10 flex items-center justify-between">
            <Button variant="ghost" onClick={handleBack} disabled={step === 0}>
              {isEn ? "Back" : "Atrás"}
            </Button>
            <Button onClick={handleNext} disabled={!isValid() || submitting}>
              {step === visibleFields.length - 1
                ? (submitting ? (isEn ? "Building your formula…" : "Construyendo tu fórmula…") : (isEn ? "Get My Formula" : "Obtener mi Fórmula"))
                : (isEn ? "Next" : "Siguiente")}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}

function FieldInput({
  field, answers, onChange, locale,
}: {
  field: Field<keyof AssessmentAnswers>;
  answers: AssessmentAnswers;
  onChange: (v: unknown) => void;
  locale: "en" | "es";
}) {
  const value = answers[field.key];
  const inputClasses = "w-full rounded-xl border border-line bg-surface px-4 py-3 text-base text-ink placeholder:text-ink-3 focus:border-ink focus:outline-none transition-colors";

  if (field.type === "phone") return <PhoneInput value={(value as string) ?? ""} onChange={(v) => onChange(v)} locale={locale} />;

  if (field.type === "text" || field.type === "email") return (
    <input type={field.type} className={inputClasses} value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)} placeholder={locale === "en" ? "Type your answer…" : "Escribe tu respuesta…"} />
  );

  if (field.type === "number") return (
    <input type="number" className={inputClasses} value={(value as number) ?? ""} onChange={(e) => onChange(Number(e.target.value))} />
  );

  if (field.type === "single") return (
    <div className="grid gap-3 sm:grid-cols-2">
      {field.options?.map((opt) => (
        <button key={opt.value} type="button" onClick={() => onChange(opt.value)}
          className={`rounded-xl border px-4 py-3 text-left text-sm transition-colors ${
            value === opt.value ? "border-ink bg-ink text-bg font-medium" : "border-line text-ink-2 hover:border-ink-2"
          }`}>
          {opt.label[locale]}
        </button>
      ))}
    </div>
  );

  if (field.type === "multi") {
    const selected = (value as string[]) ?? [];
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {field.options?.map((opt) => {
          const active = selected.includes(opt.value);
          return (
            <button key={opt.value} type="button"
              onClick={() => { if (active) onChange(selected.filter((v) => v !== opt.value)); else if (selected.length < 3) onChange([...selected, opt.value]); }}
              className={`rounded-xl border px-3 py-2.5 text-left text-xs capitalize transition-colors ${
                active ? "border-ink bg-ink text-bg font-medium" : "border-line text-ink-2 hover:border-ink-2"
              }`}>
              {opt.label[locale]}
            </button>
          );
        })}
      </div>
    );
  }

  return null;
}
