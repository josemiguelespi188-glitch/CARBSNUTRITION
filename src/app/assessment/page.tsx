"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "@/lib/i18n/context";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { AssessmentAnswers, SportType, Goal, Tolerance, YesNo } from "@/lib/types";
import { assembleCustomMix } from "@/lib/recommendation";
import { createClient } from "@/lib/supabase/client";

const FLAVORS = [
  "unflavored", "blue_raspberry", "lemon_lime", "cherry", "pineapple", "kiwi",
  "watermelon", "root_beer", "grape", "green_apple", "mixed_berry", "peach",
  "tangerine_natural", "mango_natural", "cotton_candy_natural",
];

const initialAnswers: AssessmentAnswers = {
  name: "", email: "", phone: "",
  sportType: "marathon", goal: "race", trainingHoursPerWeek: 6,
  eventName: "", eventDate: "",
  caffeineTolerance: "medium", caffeineConsumption: "occasional",
  sweatRate: "medium", hotClimateTraining: "no", sodiumIssues: "no",
  digestiveIssues: "no", fructoseTolerance: "normal", sugarSensitivity: "no",
  diabetes: "no", preferredSweetness: "regular",
  flavorPreferences: [], currentNutritionStrategy: "", carbTargetPerHour: 60,
  pastIssuesWithGels: "no", pastIssuesWithSportsDrinks: "no",
};

type Field<K extends keyof AssessmentAnswers> = {
  key: K;
  label: { en: string; es: string };
  type: "text" | "email" | "tel" | "number" | "date" | "single" | "multi";
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
const goalOptions = [
  { value: "race", label: { en: "Race", es: "Carrera" } },
  { value: "training", label: { en: "Training", es: "Entrenamiento" } },
  { value: "both", label: { en: "Both", es: "Ambos" } },
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

// The flow is dynamic: each field decides whether to show based on prior answers.
const fields: Field<keyof AssessmentAnswers>[] = [
  { key: "name", label: { en: "What's your name?", es: "¿Cuál es tu nombre?" }, type: "text" },
  { key: "email", label: { en: "Your email", es: "Tu correo electrónico" }, type: "email" },
  { key: "phone", label: { en: "Your phone number", es: "Tu número de teléfono" }, type: "tel" },

  { key: "sportType", label: { en: "What's your sport?", es: "¿Cuál es tu deporte?" }, type: "single", options: sportOptions },
  { key: "goal", label: { en: "Is this for a race, training, or both?", es: "¿Es para una carrera, entrenamiento o ambos?" }, type: "single", options: goalOptions },
  {
    key: "eventName",
    label: { en: "What event are you training for?", es: "¿Para qué evento te estás preparando?" },
    type: "text",
    showIf: (a) => a.goal === "race" || a.goal === "both",
  },
  {
    key: "eventDate",
    label: { en: "When is your event?", es: "¿Cuándo es tu evento?" },
    type: "date",
    showIf: (a) => a.goal === "race" || a.goal === "both",
  },
  { key: "trainingHoursPerWeek", label: { en: "How many hours do you train per week?", es: "¿Cuántas horas entrenas por semana?" }, type: "number" },
  { key: "carbTargetPerHour", label: { en: "How many carbs (grams) do you currently aim for per hour of effort?", es: "¿Cuántos carbohidratos (gramos) buscas consumir por hora de esfuerzo actualmente?" }, type: "number" },
  { key: "currentNutritionStrategy", label: { en: "Briefly describe your current fueling strategy", es: "Describe brevemente tu estrategia de alimentación actual" }, type: "text" },

  { key: "caffeineTolerance", label: { en: "How would you describe your caffeine tolerance?", es: "¿Cómo describirías tu tolerancia a la cafeína?" }, type: "single", options: toleranceOptions },
  {
    key: "caffeineConsumption",
    label: { en: "How much caffeine do you consume daily?", es: "¿Cuánta cafeína consumes diariamente?" },
    type: "single",
    options: [
      { value: "none", label: { en: "None", es: "Nada" } },
      { value: "occasional", label: { en: "Occasional (1 cup or less)", es: "Ocasional (1 taza o menos)" } },
      { value: "daily", label: { en: "Daily (2-3 cups)", es: "Diario (2-3 tazas)" } },
      { value: "heavy", label: { en: "Heavy (4+ cups)", es: "Alto (4+ tazas)" } },
    ],
    showIf: (a) => a.caffeineTolerance !== "none",
  },

  {
    key: "sweatRate",
    label: { en: "How would you describe your sweat rate?", es: "¿Cómo describirías tu tasa de sudoración?" },
    type: "single",
    options: [
      { value: "low", label: { en: "Low — I barely sweat", es: "Baja — casi no sudo" } },
      { value: "medium", label: { en: "Medium — average sweater", es: "Media — sudo lo normal" } },
      { value: "high", label: { en: "High — I sweat heavily / salt stains on clothes", es: "Alta — sudo mucho / manchas de sal en la ropa" } },
    ],
  },
  { key: "hotClimateTraining", label: { en: "Do you regularly train or race in hot/humid climates?", es: "¿Entrenas o compites regularmente en climas calurosos o húmedos?" }, type: "single", options: yesNo },
  { key: "sodiumIssues", label: { en: "Have you experienced cramping or sodium-related issues?", es: "¿Has tenido calambres o problemas relacionados con el sodio?" }, type: "single", options: yesNo },

  { key: "digestiveIssues", label: { en: "Do you experience digestive (GI) issues during training or racing?", es: "¿Tienes problemas digestivos durante tus entrenamientos o carreras?" }, type: "single", options: yesNo },
  {
    key: "pastIssuesWithGels",
    label: { en: "Have gels caused you problems in the past?", es: "¿Los geles te han causado problemas en el pasado?" },
    type: "single",
    options: yesNo,
    showIf: (a) => a.digestiveIssues === "yes",
  },
  {
    key: "pastIssuesWithSportsDrinks",
    label: { en: "Have sports drinks caused you problems in the past?", es: "¿Las bebidas deportivas te han causado problemas en el pasado?" },
    type: "single",
    options: yesNo,
    showIf: (a) => a.digestiveIssues === "yes",
  },
  {
    key: "fructoseTolerance",
    label: { en: "How well do you tolerate fructose (fruit sugars)?", es: "¿Qué tan bien toleras la fructosa (azúcares de fruta)?" },
    type: "single",
    options: [
      { value: "low", label: { en: "Low — fruit upsets my stomach", es: "Baja — la fruta me cae mal" } },
      { value: "normal", label: { en: "Normal", es: "Normal" } },
      { value: "high", label: { en: "High — no issues at all", es: "Alta — no tengo ningún problema" } },
    ],
  },

  { key: "sugarSensitivity", label: { en: "Do you have any sugar sensitivity?", es: "¿Tienes alguna sensibilidad al azúcar?" }, type: "single", options: yesNo },
  { key: "diabetes", label: { en: "Do you have diabetes or pre-diabetes?", es: "¿Tienes diabetes o prediabetes?" }, type: "single", options: yesNo },
  {
    key: "preferredSweetness",
    label: { en: "What's your preferred sweetness level?", es: "¿Cuál es tu nivel de dulzor preferido?" },
    type: "single",
    options: [
      { value: "light", label: { en: "Light", es: "Ligero" } },
      { value: "regular", label: { en: "Regular", es: "Regular" } },
      { value: "intense", label: { en: "Intense", es: "Intenso" } },
    ],
  },
  {
    key: "flavorPreferences",
    label: { en: "Pick your favorite flavors (choose up to 3)", es: "Elige tus sabores favoritos (hasta 3)" },
    type: "multi",
    options: FLAVORS.map((f) => ({ value: f, label: { en: f.replace(/_/g, " "), es: f.replace(/_/g, " ") } })),
  },
];

export default function AssessmentPage() {
  const { t, locale } = useLocale();
  const router = useRouter();
  const [answers, setAnswers] = useState<AssessmentAnswers>(initialAnswers);
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);

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
    if (current.type === "number") return typeof value === "number" && !Number.isNaN(value);
    if (current.key === "eventName" || current.key === "eventDate" || current.key === "currentNutritionStrategy") {
      return true; // optional free text
    }
    return value !== "" && value !== undefined && value !== null;
  }

  async function handleNext() {
    if (step < visibleFields.length - 1) {
      setStep((s) => s + 1);
      return;
    }
    await finish();
  }

  function handleBack() {
    if (step > 0) setStep((s) => s - 1);
  }

  async function finish() {
    setSubmitting(true);
    const mix = assembleCustomMix(answers);

    // Persist to Supabase if configured; never block the user flow on this.
    try {
      const supabase = createClient();
      const { data: assessment } = await supabase
        .from("assessments")
        .insert({
          name: answers.name,
          email: answers.email,
          phone: answers.phone,
          answers,
        })
        .select("id")
        .single();

      if (assessment?.id) {
        await supabase.from("recommendations").insert({
          assessment_id: assessment.id,
          formula: mix,
        });
      }
    } catch {
      // Supabase not configured in this environment — continue with local flow.
    }

    sessionStorage.setItem("carbyn:answers", JSON.stringify(answers));
    sessionStorage.setItem("carbyn:mix", JSON.stringify(mix));
    router.push("/mix");
  }

  if (!current) return null;

  return (
    <div className="flex min-h-screen flex-col bg-black">
      <SiteHeader />
      <main className="flex flex-1 flex-col items-center justify-center px-6 pt-28 pb-16">
        <div className="w-full max-w-xl">
          <div className="mb-8 h-1 w-full overflow-hidden rounded-full bg-neutral-900">
            <div className="h-full bg-white transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
          <p className="mb-2 text-xs uppercase tracking-[0.3em] text-neutral-500">
            {locale === "en" ? `Step ${step + 1} of ${visibleFields.length}` : `Paso ${step + 1} de ${visibleFields.length}`}
          </p>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">{current.label[locale]}</h1>

          <div className="mt-8">
            <FieldInput field={current} value={answers[current.key]} onChange={(v) => update(current.key, v as never)} locale={locale} />
          </div>

          <div className="mt-10 flex items-center justify-between">
            <Button variant="ghost" onClick={handleBack} disabled={step === 0}>
              {t.nav.assessment === "Start Assessment" ? "Back" : "Atrás"}
            </Button>
            <Button onClick={handleNext} disabled={!isValid() || submitting}>
              {step === visibleFields.length - 1
                ? (submitting ? (locale === "en" ? "Building your formula…" : "Construyendo tu fórmula…") : (locale === "en" ? "Get My Formula" : "Obtener mi Fórmula"))
                : (locale === "en" ? "Next" : "Siguiente")}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}

function FieldInput({
  field, value, onChange, locale,
}: {
  field: Field<keyof AssessmentAnswers>;
  value: unknown;
  onChange: (v: unknown) => void;
  locale: "en" | "es";
}) {
  const inputClasses = "w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 text-base text-white placeholder:text-neutral-600 focus:border-white focus:outline-none transition-colors";

  if (field.type === "text" || field.type === "email" || field.type === "tel" || field.type === "date") {
    return (
      <input
        type={field.type}
        className={inputClasses}
        value={(value as string) ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={locale === "en" ? "Type your answer…" : "Escribe tu respuesta…"}
      />
    );
  }

  if (field.type === "number") {
    return (
      <input
        type="number"
        className={inputClasses}
        value={(value as number) ?? ""}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    );
  }

  if (field.type === "single") {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        {field.options?.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`rounded-xl border px-4 py-3 text-left text-sm transition-colors ${
              value === opt.value
                ? "border-white bg-white text-black font-medium"
                : "border-neutral-700 text-neutral-300 hover:border-neutral-400"
            }`}
          >
            {opt.label[locale]}
          </button>
        ))}
      </div>
    );
  }

  if (field.type === "multi") {
    const selected = (value as string[]) ?? [];
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {field.options?.map((opt) => {
          const active = selected.includes(opt.value);
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                if (active) onChange(selected.filter((v) => v !== opt.value));
                else if (selected.length < 3) onChange([...selected, opt.value]);
              }}
              className={`rounded-xl border px-3 py-2.5 text-left text-xs capitalize transition-colors ${
                active ? "border-white bg-white text-black font-medium" : "border-neutral-700 text-neutral-300 hover:border-neutral-400"
              }`}
            >
              {opt.label[locale]}
            </button>
          );
        })}
      </div>
    );
  }

  return null;
}
