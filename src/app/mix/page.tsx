"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale } from "@/lib/i18n/context";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardTitle } from "@/components/ui/card";
import { AssessmentAnswers, CustomMix, FormulaRecommendation } from "@/lib/types";
import {
  buildPackRecommendation,
  buildDualMix,
  buildScoopPlan,
  buildRaceDayPlan,
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

const carbSteps = [25, 50, 75, 100, 125, 150] as const;
const sodiumSteps = [200, 400, 600, 800, 1000] as const;
const caffeineSteps = [0, 25, 50, 75, 100] as const;

type ChatMsg = { role: "user" | "assistant"; text: string };

export default function MixPage() {
  const { t, locale } = useLocale();
  const router = useRouter();

  const [answers, setAnswers] = useState<AssessmentAnswers | null>(null);
  const [mix, setMix] = useState<CustomMix | null>(null);
  const [chat, setChat] = useState<ChatMsg[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatBusy, setChatBusy] = useState(false);

  useEffect(() => {
    const a = sessionStorage.getItem("carbyn:answers");
    const m = sessionStorage.getItem("carbyn:mix");
    if (!a || !m) {
      router.replace("/assessment");
      return;
    }
    setAnswers(JSON.parse(a));
    setMix(JSON.parse(m));
  }, [router]);

  if (!answers || !mix) return null;

  const pack = buildPackRecommendation(answers);
  const warnings = getEditWarnings(mix, mix);
  const scoopPlan = buildScoopPlan(answers);
  const totalScoops = scoopPlan.reduce((sum, w) => sum + w.scoops, 0);
  const weeksToEvent = answers.eventDate
    ? Math.max(0, Math.round((new Date(answers.eventDate).getTime() - Date.now()) / (7 * 24 * 60 * 60 * 1000)))
    : null;
  const raceDay = buildRaceDayPlan(answers, mix);
  const showDual = answers.caffeineGoal === "both" || answers.goal === "both";
  const dual = showDual ? buildDualMix(answers) : null;

  function update<K extends keyof FormulaRecommendation>(key: K, value: FormulaRecommendation[K]) {
    setMix((prev) => {
      if (!prev) return prev;
      const next = { ...prev, [key]: value };
      sessionStorage.setItem("carbyn:mix", JSON.stringify(next));
      return next;
    });
  }

  async function sendChat() {
    const question = chatInput.trim();
    if (!question || !answers || !mix) return;
    setChat((c) => [...c, { role: "user", text: question }]);
    setChatInput("");
    setChatBusy(true);
    try {
      const res = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, answers, formula: mix, locale }),
      });
      const data = await res.json();
      setChat((c) => [...c, { role: "assistant", text: data.answer || (locale === "en" ? "Sorry, I couldn't process that." : "Lo siento, no pude procesar eso.") }]);
    } finally {
      setChatBusy(false);
    }
  }

  const isEn = locale === "en";

  return (
    <div className="flex min-h-screen flex-col bg-black">
      <SiteHeader />
      <main className="flex-1 px-6 pt-28 pb-24">
        <div className="mx-auto max-w-3xl">
          {/* Premium product mockup */}
          <div className="mb-8 overflow-hidden rounded-3xl border border-neutral-800 bg-black">
            <div className="bg-gradient-to-b from-neutral-900 to-black px-8 py-12 text-center">
              <p className="text-[10px] uppercase tracking-[0.5em] text-neutral-600">CARBYN</p>
              <h2 className="mt-4 text-3xl sm:text-5xl font-black uppercase tracking-tight text-white">
                {(answers.name.split(" ")[0] || answers.name).toUpperCase()}&apos;S CUSTOM FUEL
              </h2>
              {answers.eventName && (
                <p className="mt-3 text-sm uppercase tracking-[0.25em] text-neutral-400">
                  {isEn ? `Built for ${answers.eventName}` : `Hecho para ${answers.eventName}`}
                </p>
              )}
              <p className="mt-4 italic text-neutral-400">{mix.motivationalMessage[locale]}</p>
              <div className="mt-6 inline-flex flex-wrap items-center justify-center gap-3 rounded-full border border-neutral-700 px-5 py-2 text-xs text-neutral-300">
                <span>{mix.carbsPerServing}g {isEn ? "carbs" : "carbos"}</span>
                <span className="text-neutral-600">|</span>
                <span>{mix.sodiumPerServing}mg {isEn ? "sodium" : "sodio"}</span>
                <span className="text-neutral-600">|</span>
                <span>{mix.caffeinePerServing}mg {isEn ? "caffeine" : "cafeína"}</span>
              </div>
            </div>
          </div>

          {/* Package preview */}
          <div className="rounded-2xl border border-neutral-800 bg-gradient-to-br from-neutral-950 to-black p-8 text-center">
            <p className="text-xs uppercase tracking-[0.4em] text-neutral-500">{isEn ? "Your Personalized Formula" : "Tu Fórmula Personalizada"}</p>
            <h1 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight">{mix.packageLabel}</h1>
            <p className="mt-3 italic text-neutral-400">{mix.motivationalMessage[locale]}</p>
            {answers.eventName && (
              <p className="mt-1 text-sm text-neutral-500">
                {isEn ? `Built for your ${answers.eventName} preparation.` : `Hecho para tu preparación de ${answers.eventName}.`}
              </p>
            )}
          </div>

          {/* AI explanation panel */}
          <section className="mt-10">
            <Card className="border-neutral-700">
              <CardTitle>{isEn ? "Why We Recommended This" : "Por Qué Te Recomendamos Esto"}</CardTitle>
              <div className="mt-4 space-y-3">
                {mix.reasoning.map((r) => (
                  <p key={r.field} className="text-sm text-neutral-400 leading-relaxed">
                    {r.explanation[locale]}
                  </p>
                ))}
              </div>
            </Card>
          </section>

          {/* Custom mix editor */}
          <section className="mt-10">
            <h2 className="text-xl font-semibold tracking-tight">{isEn ? "Your Mix Editor" : "Tu Editor de Mezcla"}</h2>
            <p className="mt-1 text-sm text-neutral-500">
              {isEn ? "Adjust any value — we'll let you know if you stray far from your recommendation." : "Ajusta cualquier valor — te avisaremos si te alejas mucho de tu recomendación."}
            </p>

            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <EditorField label={isEn ? "Carbs per serving" : "Carbohidratos por porción"}>
                <StepSelect value={mix.carbsPerServing} steps={carbSteps} suffix="g" onChange={(v) => update("carbsPerServing", v as FormulaRecommendation["carbsPerServing"])} />
              </EditorField>
              <EditorField label={isEn ? "Sodium per serving" : "Sodio por porción"}>
                <StepSelect value={mix.sodiumPerServing} steps={sodiumSteps} suffix="mg" onChange={(v) => update("sodiumPerServing", v as FormulaRecommendation["sodiumPerServing"])} />
              </EditorField>
              <EditorField label={isEn ? "Caffeine per serving" : "Cafeína por porción"}>
                <StepSelect value={mix.caffeinePerServing} steps={caffeineSteps} suffix="mg" onChange={(v) => update("caffeinePerServing", v as FormulaRecommendation["caffeinePerServing"])} />
              </EditorField>
              <EditorField label={isEn ? "Malto:Fructose ratio" : "Proporción Malto:Fructosa"}>
                <div className="flex gap-2">
                  {(["1:0.8", "2:1"] as const).map((r) => (
                    <button key={r} onClick={() => update("ratio", r)}
                      className={`flex-1 rounded-lg border px-3 py-2 text-sm transition-colors ${mix.ratio === r ? "border-white bg-white text-black font-medium" : "border-neutral-700 text-neutral-300 hover:border-neutral-400"}`}>
                      {r}
                    </button>
                  ))}
                </div>
              </EditorField>
              <EditorField label={isEn ? "Flavor strength" : "Intensidad del sabor"}>
                <div className="flex gap-2">
                  {(["lite", "regular", "mega"] as const).map((s) => (
                    <button key={s} onClick={() => update("flavorStrength", s)}
                      className={`flex-1 rounded-lg border px-3 py-2 text-sm capitalize transition-colors ${mix.flavorStrength === s ? "border-white bg-white text-black font-medium" : "border-neutral-700 text-neutral-300 hover:border-neutral-400"}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </EditorField>
              <EditorField label={isEn ? "Preservatives" : "Conservadores"}>
                <div className="flex gap-2">
                  {(["yes", "no"] as const).map((v) => (
                    <button key={v} onClick={() => update("preservatives", v)}
                      className={`flex-1 rounded-lg border px-3 py-2 text-sm transition-colors ${mix.preservatives === v ? "border-white bg-white text-black font-medium" : "border-neutral-700 text-neutral-300 hover:border-neutral-400"}`}>
                      {v === "yes" ? (isEn ? "Yes (recommended)" : "Sí (recomendado)") : (isEn ? "No preservatives" : "Sin conservadores")}
                    </button>
                  ))}
                </div>
              </EditorField>
              <EditorField label={isEn ? "Include a scooper?" : "¿Incluir cuchara dosificadora?"}>
                <div className="flex gap-2">
                  {(["yes", "no"] as const).map((v) => (
                    <button key={v} onClick={() => update("scooper", v)}
                      className={`flex-1 rounded-lg border px-3 py-2 text-sm transition-colors ${mix.scooper === v ? "border-white bg-white text-black font-medium" : "border-neutral-700 text-neutral-300 hover:border-neutral-400"}`}>
                      {v === "yes" ? (isEn ? "Yes" : "Sí") : "No"}
                    </button>
                  ))}
                </div>
              </EditorField>
            </div>

            {warnings.length > 0 && (
              <div className="mt-6 space-y-2">
                {warnings.map((w) => (
                  <div key={w} className="rounded-xl border border-neutral-600 bg-neutral-950 px-4 py-3 text-sm text-neutral-300">
                    ⚠️ {editWarningCopy[w][locale]}
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Pack recommendation */}
          <section className="mt-10">
            <Card>
              <CardTitle>{isEn ? "Recommended Supply" : "Suministro Recomendado"}</CardTitle>
              <CardBody>
                <p className="text-base text-white font-medium">{pack.label[locale]}</p>
                <p className="mt-2">{pack.reasoning[locale]}</p>
                {pack.bundleRaceFormula && (
                  <p className="mt-3 rounded-lg border border-neutral-700 px-4 py-3 text-neutral-300">
                    {isEn
                      ? "We also suggest pairing this with a separate Race Day Formula — tuned specifically for competition demands."
                      : "También sugerimos combinarlo con una Fórmula de Día de Carrera independiente — ajustada específicamente para las exigencias de competencia."}
                  </p>
                )}
              </CardBody>
            </Card>
          </section>

          {/* Scoop planning */}
          <section className="mt-10">
            <Card>
              <CardTitle>{isEn ? "Scoop Plan" : "Plan de Cucharadas"}</CardTitle>
              <div className="mt-2 flex flex-wrap gap-6 text-sm text-neutral-300">
                <span>{isEn ? "Total scoops:" : "Cucharadas totales:"} <span className="font-semibold text-white">{totalScoops}</span></span>
                {weeksToEvent !== null && (
                  <span>{isEn ? "Weeks until event:" : "Semanas hasta el evento:"} <span className="font-semibold text-white">{weeksToEvent}</span></span>
                )}
              </div>
              <div className="mt-6 h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={scoopPlan} margin={{ top: 8, right: 8, bottom: 8, left: -16 }}>
                    <CartesianGrid stroke="#262626" vertical={false} />
                    <XAxis dataKey="week" stroke="#737373" fontSize={11} tickLine={false} />
                    <YAxis stroke="#737373" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip
                      cursor={{ fill: "#171717" }}
                      contentStyle={{ background: "#0a0a0a", border: "1px solid #404040", borderRadius: 8, color: "#fff" }}
                      labelFormatter={(w) => (isEn ? `Week ${w}` : `Semana ${w}`)}
                    />
                    <Bar dataKey="scoops" fill="#ffffff" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </section>

          {/* Race day fueling plan */}
          <section className="mt-10">
            <Card>
              <CardTitle>{isEn ? "Race Day Fueling Plan" : "Plan de Alimentación del Día de Carrera"}</CardTitle>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <PhaseCard
                  title={isEn ? "Pre-Race" : "Pre-Carrera"}
                  metric={`${raceDay.preRace.carbs}g`}
                  desc={raceDay.preRace.description[locale]}
                />
                {raceDay.bike && (
                  <PhaseCard
                    title={isEn ? "Bike" : "Bici"}
                    metric={`${raceDay.bike.carbsPerHour}g/h`}
                    desc={raceDay.bike.description[locale]}
                  />
                )}
                {raceDay.run && (
                  <PhaseCard
                    title={isEn ? "Run" : "Carrera"}
                    metric={`${raceDay.run.carbsPerHour}g/h`}
                    desc={raceDay.run.description[locale]}
                  />
                )}
                <PhaseCard
                  title={isEn ? "Recovery" : "Recuperación"}
                  metric={`${raceDay.recovery.carbs}g`}
                  desc={raceDay.recovery.description[locale]}
                />
              </div>
            </Card>
          </section>

          {/* Dual mix view */}
          {dual && (
            <section className="mt-10">
              <Card>
                <CardTitle>{isEn ? "Training Mix vs Race Mix" : "Mezcla de Entrenamiento vs Carrera"}</CardTitle>
                <p className="mt-2 text-sm text-neutral-400 leading-relaxed">{dual.reasoning[locale]}</p>
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <MixSummary
                    title={isEn ? "Training Mix" : "Mezcla de Entrenamiento"}
                    formula={dual.training}
                    isEn={isEn}
                  />
                  <MixSummary
                    title={isEn ? "Race Mix" : "Mezcla de Carrera"}
                    formula={dual.race}
                    isEn={isEn}
                  />
                </div>
              </Card>
            </section>
          )}

          {/* AI chat */}
          <section className="mt-10">
            <Card>
              <CardTitle>{isEn ? "Ask Our AI Advisor" : "Pregúntale a Nuestro Asesor de IA"}</CardTitle>
              <p className="mt-1 text-sm text-neutral-500">
                {isEn ? `e.g. "Why did you give me ${mix.sodiumPerServing}mg of sodium?"` : `Ej. "¿Por qué me diste ${mix.sodiumPerServing}mg de sodio?"`}
              </p>
              <div className="mt-4 max-h-72 space-y-3 overflow-y-auto pr-1">
                {chat.map((m, i) => (
                  <div key={i} className={`rounded-xl px-4 py-2.5 text-sm leading-relaxed ${m.role === "user" ? "ml-8 bg-white text-black" : "mr-8 bg-neutral-900 text-neutral-300"}`}>
                    {m.text}
                  </div>
                ))}
                {chatBusy && <div className="mr-8 rounded-xl bg-neutral-900 px-4 py-2.5 text-sm text-neutral-500">{isEn ? "Thinking…" : "Pensando…"}</div>}
              </div>
              <div className="mt-4 flex gap-2">
                <input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendChat()}
                  placeholder={isEn ? "Type your question…" : "Escribe tu pregunta…"}
                  className="flex-1 rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-2.5 text-sm text-white placeholder:text-neutral-600 focus:border-white focus:outline-none"
                />
                <Button size="sm" onClick={sendChat} disabled={chatBusy || !chatInput.trim()}>{isEn ? "Send" : "Enviar"}</Button>
              </div>
            </Card>
          </section>

          <div className="mt-12 flex flex-col items-center gap-3 text-center">
            <Button size="lg">{isEn ? "Order This Formula" : "Ordenar Esta Fórmula"}</Button>
            <Link href="/assessment" className="text-xs text-neutral-500 underline underline-offset-4 hover:text-neutral-300">
              {isEn ? "Retake the assessment" : "Repetir la evaluación"}
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

function PhaseCard({ title, metric, desc }: { title: string; metric: string; desc: string }) {
  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-5">
      <div className="flex items-baseline justify-between">
        <p className="text-xs uppercase tracking-widest text-neutral-500">{title}</p>
        <p className="text-lg font-semibold text-white">{metric}</p>
      </div>
      <p className="mt-3 text-sm text-neutral-400 leading-relaxed">{desc}</p>
    </div>
  );
}

function MixSummary({ title, formula, isEn }: { title: string; formula: FormulaRecommendation; isEn: boolean }) {
  const rows: [string, string][] = [
    [isEn ? "Carbs" : "Carbos", `${formula.carbsPerServing}g`],
    [isEn ? "Sodium" : "Sodio", `${formula.sodiumPerServing}mg`],
    [isEn ? "Caffeine" : "Cafeína", `${formula.caffeinePerServing}mg`],
    [isEn ? "Flavor" : "Sabor", formula.flavor.replace(/_/g, " ")],
  ];
  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-5">
      <p className="text-sm font-semibold uppercase tracking-widest text-white">{title}</p>
      <dl className="mt-4 space-y-2">
        {rows.map(([k, v]) => (
          <div key={k} className="flex items-center justify-between text-sm">
            <dt className="text-neutral-500">{k}</dt>
            <dd className="capitalize text-neutral-200">{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function EditorField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-2 block text-xs uppercase tracking-widest text-neutral-500">{label}</label>
      {children}
    </div>
  );
}

function StepSelect<T extends number>({ value, steps, suffix, onChange }: { value: T; steps: readonly T[]; suffix: string; onChange: (v: T) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {steps.map((s) => (
        <button
          key={s}
          onClick={() => onChange(s)}
          className={`rounded-lg border px-3 py-2 text-sm transition-colors ${value === s ? "border-white bg-white text-black font-medium" : "border-neutral-700 text-neutral-300 hover:border-neutral-400"}`}
        >
          {s}{suffix}
        </button>
      ))}
    </div>
  );
}
