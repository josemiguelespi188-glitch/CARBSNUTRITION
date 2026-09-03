"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "@/lib/i18n/context";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { AssessmentAnswers, SportType } from "@/lib/types";
import { assembleCustomMix } from "@/lib/recommendation";

function SportSVG({ sport }: { sport: SportType }) {
  const s = { width: 80, height: 80, display: "block", margin: "0 auto" };
  switch (sport) {
    case "marathon": case "trail":
      return (
        <svg viewBox="0 0 60 60" style={s} stroke="currentColor" fill="none" strokeWidth="2" strokeLinecap="round">
          <circle cx="30" cy="10" r="5"/>
          <line x1="30" y1="15" x2="30" y2="34"/>
          <line x1="30" y1="22" x2="22" y2="28"/><line x1="30" y1="22" x2="38" y2="28"/>
          <path d="M30 34 L22 48"/><path d="M30 34 L38 48"/>
          {sport === "trail" && <path d="M4 50 Q20 42 30 50 Q40 58 56 50" strokeWidth="1.5" opacity="0.5"/>}
        </svg>
      );
    case "ironman": case "triathlon":
      return (
        <svg viewBox="0 0 80 60" style={{ ...s, width: 100 }} stroke="currentColor" fill="none" strokeWidth="2" strokeLinecap="round">
          <circle cx="10" cy="22" r="4"/><path d="M10 26 Q16 30 20 26 Q24 22 14 20"/>
          <circle cx="38" cy="22" r="4"/><circle cx="30" cy="36" r="7"/><circle cx="46" cy="36" r="7"/>
          <path d="M30 36 L38 22 L46 36 L38 30 Z"/>
          <circle cx="66" cy="16" r="4"/>
          <line x1="66" y1="20" x2="66" y2="34"/>
          <path d="M66 34 L60 46"/><path d="M66 34 L72 46"/>
          <line x1="66" y1="26" x2="60" y2="30"/><line x1="66" y1="26" x2="72" y2="30"/>
        </svg>
      );
    case "cycling":
      return (
        <svg viewBox="0 0 60 60" style={s} stroke="currentColor" fill="none" strokeWidth="2" strokeLinecap="round">
          <circle cx="16" cy="42" r="12"/><circle cx="44" cy="42" r="12"/>
          <path d="M30 30 L16 42 L44 42 L30 30"/>
          <circle cx="30" cy="18" r="5"/>
          <path d="M30 23 L30 30"/><path d="M25 28 L35 28"/><path d="M44 30 L36 24"/>
        </svg>
      );
    case "ultra":
      return (
        <svg viewBox="0 0 60 60" style={s} stroke="currentColor" fill="none" strokeWidth="2" strokeLinecap="round">
          <circle cx="30" cy="10" r="5"/>
          <line x1="30" y1="15" x2="30" y2="34"/>
          <line x1="30" y1="22" x2="22" y2="28"/><line x1="30" y1="22" x2="38" y2="28"/>
          <path d="M30 34 L22 48"/><path d="M30 34 L38 48"/>
          <rect x="31" y="16" width="10" height="14" rx="3"/><line x1="31" y1="20" x2="41" y2="20"/>
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 60 60" style={s} stroke="currentColor" fill="none" strokeWidth="2" strokeLinecap="round">
          <polygon points="30,5 36,22 54,22 40,33 46,50 30,40 14,50 20,33 6,22 24,22"/>
        </svg>
      );
  }
}

const DEFAULT_ANSWERS: AssessmentAnswers = {
  name: "", email: "", phone: "",
  sportType: "marathon", goal: "race", trainingHoursPerWeek: 8,
  eventName: "", eventDate: "",
  age: 30, personalBest: "", raceDistance: "",
  caffeineTolerance: "medium", caffeineConsumption: "occasional",
  sweatRate: "medium", hotClimateTraining: "no", sodiumIssues: "no",
  digestiveIssues: "no", fructoseTolerance: "normal", sugarSensitivity: "no",
  diabetes: "no", preferredSweetness: "regular",
  flavorPreferences: [], currentNutritionStrategy: "",
  nutritionStrategyItems: [], nutritionStrategyNotes: "",
  caffeineGoal: "both", carbTargetPerHour: 60,
  pastIssuesWithGels: "no", pastIssuesWithSportsDrinks: "no",
};

const SPORTS = [
  { v: "marathon",  en: "Marathon",      es: "Maratón" },
  { v: "ironman",   en: "Ironman",       es: "Ironman" },
  { v: "triathlon", en: "Triathlon",     es: "Triatlón" },
  { v: "cycling",   en: "Cycling",       es: "Ciclismo" },
  { v: "ultra",     en: "Ultra Running", es: "Ultra Running" },
  { v: "trail",     en: "Trail Running", es: "Trail Running" },
  { v: "other",     en: "Other",         es: "Otro" },
] as const;

const PB_LABEL: Record<SportType, { en: string; es: string }> = {
  marathon:  { en: "What's your marathon PR?",           es: "¿Cuál es tu mejor tiempo en maratón?" },
  ironman:   { en: "What's your 70.3 PR?",               es: "¿Cuál es tu mejor tiempo en 70.3?" },
  triathlon: { en: "What's your Olympic tri PR?",        es: "¿Cuál es tu mejor tiempo olímpico?" },
  cycling:   { en: "What's your 100K gran fondo time?",  es: "¿Cuánto tiempo te toma un gran fondo 100K?" },
  ultra:     { en: "What's your 50K PR?",                es: "¿Cuál es tu mejor tiempo en 50K?" },
  trail:     { en: "What's your trail marathon PR?",     es: "¿Cuál es tu mejor tiempo en trail maratón?" },
  other:     { en: "What's your performance benchmark?", es: "¿Cuál es tu referencia de rendimiento?" },
};

const RACE_LISTS: Record<SportType, string[]> = {
  marathon:  ["5K", "10K", "Media maratón (21K)", "Maratón (42K)"],
  trail:     ["Trail corto (≤21K)", "Trail largo (21–50K)", "Ultra trail (50K+)"],
  ironman:   ["Sprint", "Olímpico", "70.3", "Ironman (140.6)"],
  triathlon: ["Sprint", "Olímpico", "70.3", "Ironman (140.6)"],
  cycling:   ["Gran fondo / ruta", "Contrarreloj", "Gravel"],
  ultra:     ["50K", "50 millas", "100K", "100 millas"],
  other:     [],
};

type Phase = "identity" | "profile" | "goal" | "transition" | "formula";
type FormulaKey = "carbTargetPerHour"|"sweatRate"|"hotClimateTraining"|"sodiumIssues"|"caffeineTolerance"|"caffeineConsumption"|"caffeineGoal"|"fructoseTolerance"|"digestiveIssues"|"pastIssuesWithGels"|"pastIssuesWithSportsDrinks"|"sugarSensitivity"|"diabetes"|"preferredSweetness";

const ALL_FORMULA: FormulaKey[] = ["carbTargetPerHour","sweatRate","hotClimateTraining","sodiumIssues","caffeineTolerance","caffeineConsumption","caffeineGoal","fructoseTolerance","digestiveIssues","pastIssuesWithGels","pastIssuesWithSportsDrinks","sugarSensitivity","diabetes","preferredSweetness"];

function activeFormula(a: AssessmentAnswers): FormulaKey[] {
  return ALL_FORMULA.filter(k => {
    if (k === "pastIssuesWithGels" || k === "pastIssuesWithSportsDrinks") return a.digestiveIssues === "yes";
    if (k === "caffeineConsumption" || k === "caffeineGoal") return a.caffeineTolerance !== "none";
    return true;
  });
}

export default function AssessmentPage() {
  const { locale } = useLocale();
  const router = useRouter();
  const isEn = locale === "en";

  const [phase, setPhase] = useState<Phase>("identity");
  const [identityStep, setIdentityStep] = useState(0);
  const [goalStep, setGoalStep] = useState(0);
  const [formulaIdx, setFormulaIdx] = useState(0);
  const [answers, setAnswers] = useState<AssessmentAnswers>(DEFAULT_ANSWERS);
  const [customRace, setCustomRace] = useState("");

  useEffect(() => {
    try {
      const u = sessionStorage.getItem("zenit:user");
      if (u) { const { name, email, phone } = JSON.parse(u); setAnswers(p => ({ ...p, name: name||p.name, email: email||p.email, phone: phone||p.phone })); }
      const f = sessionStorage.getItem("zenit:flavor");
      if (f) setAnswers(p => ({ ...p, flavorPreferences: [f] }));
    } catch { /* ignore */ }
  }, []);

  function upd<K extends keyof AssessmentAnswers>(k: K, v: AssessmentAnswers[K]) {
    setAnswers(p => ({ ...p, [k]: v }));
  }

  const fSteps = activeFormula(answers);
  const curFKey = fSteps[formulaIdx] as FormulaKey | undefined;

  const totalSteps = 4 + 1 + 3 + 1 + fSteps.length;
  let done = 0;
  if (phase === "profile") done = 4;
  else if (phase === "goal") done = 5 + goalStep;
  else if (phase === "transition") done = 8;
  else if (phase === "formula") done = 9 + formulaIdx;
  else done = identityStep;
  const pct = Math.round((done / totalSteps) * 100);

  function finish(final: AssessmentAnswers) {
    try {
      const mix = assembleCustomMix(final);
      sessionStorage.setItem("carbyn:answers", JSON.stringify(final));
      sessionStorage.setItem("carbyn:mix", JSON.stringify(mix));
    } catch { /* ignore */ }
    router.push("/mix");
  }

  function formulaNext(k: FormulaKey, v: unknown) {
    const updated = { ...answers, [k]: v };
    setAnswers(updated);
    const steps = activeFormula(updated);
    if (formulaIdx + 1 >= steps.length) finish(updated);
    else setFormulaIdx(i => i + 1);
  }

  const phaseLabel: Record<Phase, string> = {
    identity: isEn ? "Account" : "Cuenta",
    profile: isEn ? "Profile" : "Perfil",
    goal: isEn ? "Next Goal" : "Meta",
    transition: isEn ? "Formula" : "Fórmula",
    formula: isEn ? "Formula" : "Fórmula",
  };

  function Card({ children, onBack }: { children: React.ReactNode; onBack?: () => void }) {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: "var(--bg)", color: "var(--ink)" }}>
        <SiteHeader />
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
          <div className="w-full max-w-lg mb-8">
            <div className="flex justify-between text-xs mb-2" style={{ color: "var(--ink-3)" }}>
              <span>{phaseLabel[phase]}</span><span>{pct}%</span>
            </div>
            <div className="h-1 rounded-full" style={{ background: "var(--line)" }}>
              <div className="h-1 rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: "var(--ink)" }}/>
            </div>
          </div>
          <div className="w-full max-w-lg rounded-2xl p-8" style={{ background: "var(--surface)", border: "1px solid var(--line)" }}>
            {children}
          </div>
          {onBack && (
            <button className="mt-4 text-sm" style={{ color: "var(--ink-3)" }} onClick={onBack}>
              ← {isEn ? "Back" : "Regresar"}
            </button>
          )}
        </div>
      </div>
    );
  }

  function Choices({ opts, onPick }: { opts: { v: string; en: string; es: string }[]; onPick: (v: string) => void }) {
    return (
      <div className="grid grid-cols-1 gap-3 mt-4">
        {opts.map(o => (
          <button key={o.v} onClick={() => onPick(o.v)}
            className="text-left px-4 py-3 rounded-xl transition-all"
            style={{ background: "var(--surface-2)", border: "1px solid var(--line)", color: "var(--ink)" }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--ink-2)")}
            onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--line)")}>
            {isEn ? o.en : o.es}
          </button>
        ))}
      </div>
    );
  }

  function YesNo({ onPick }: { onPick: (v: string) => void }) {
    return (
      <div className="grid grid-cols-2 gap-3 mt-6">
        {[{ v: "yes", en: "Yes", es: "Sí" }, { v: "no", en: "No", es: "No" }].map(o => (
          <button key={o.v} onClick={() => onPick(o.v)}
            className="py-4 rounded-xl text-lg font-medium"
            style={{ background: "var(--surface-2)", border: "1px solid var(--line)", color: "var(--ink)" }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--ink-2)")}
            onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--line)")}>
            {isEn ? o.en : o.es}
          </button>
        ))}
      </div>
    );
  }

  if (phase === "identity") {
    if (identityStep === 0) return (
      <Card onBack={() => router.push("/")}>
        <h2 className="text-xl font-semibold mb-6">{isEn ? "Let's get to know you" : "Cuéntanos sobre ti"}</h2>
        {[
          { k: "name",  label: isEn ? "Name" : "Nombre",    type: "text",  ph: isEn ? "Your name" : "Tu nombre" },
          { k: "email", label: "Email",                      type: "email", ph: "you@email.com" },
          { k: "phone", label: isEn ? "Phone" : "Teléfono", type: "tel",   ph: "+52 55 0000 0000" },
        ].map(f => (
          <div key={f.k} className="mb-4">
            <label className="text-xs block mb-1" style={{ color: "var(--ink-3)" }}>{f.label}</label>
            <input type={f.type} value={(answers as Record<string,string>)[f.k]}
              onChange={e => upd(f.k as keyof AssessmentAnswers, e.target.value as never)}
              placeholder={f.ph}
              className="w-full px-3 py-2 rounded-lg text-sm"
              style={{ background: "var(--surface-2)", border: "1px solid var(--line)", color: "var(--ink)" }}/>
          </div>
        ))}
        <Button className="w-full mt-2" onClick={() => {
          if (answers.name.trim()) {
            try { sessionStorage.setItem("zenit:user", JSON.stringify({ name: answers.name, email: answers.email, phone: answers.phone })); } catch { /* ignore */ }
            setIdentityStep(1);
          }
        }}>{isEn ? "Continue →" : "Continuar →"}</Button>
      </Card>
    );

    if (identityStep === 1) return (
      <Card onBack={() => setIdentityStep(0)}>
        <h2 className="text-xl font-semibold mb-6">{isEn ? "What's your primary sport?" : "¿Cuál es tu deporte principal?"}</h2>
        <Choices opts={SPORTS as unknown as { v: string; en: string; es: string }[]} onPick={v => { upd("sportType", v as SportType); setIdentityStep(2); }}/>
      </Card>
    );

    if (identityStep === 2) {
      const age = answers.age ?? 30;
      return (
        <Card onBack={() => setIdentityStep(1)}>
          <h2 className="text-xl font-semibold mb-6">{isEn ? "How old are you?" : "¿Cuántos años tienes?"}</h2>
          <div className="text-5xl font-black mb-6 text-center" style={{ fontFamily: "var(--font-mono)" }}>{age}</div>
          <input type="range" min={14} max={75} value={age} onChange={e => upd("age", Number(e.target.value))} className="w-full accent-current mb-2"/>
          <div className="flex justify-between text-xs mb-6" style={{ color: "var(--ink-3)" }}><span>14</span><span>75</span></div>
          <Button className="w-full" onClick={() => setIdentityStep(3)}>{isEn ? "Continue →" : "Continuar →"}</Button>
        </Card>
      );
    }

    return (
      <Card onBack={() => setIdentityStep(2)}>
        <h2 className="text-xl font-semibold mb-2">{isEn ? PB_LABEL[answers.sportType].en : PB_LABEL[answers.sportType].es}</h2>
        <p className="text-sm mb-6" style={{ color: "var(--ink-3)" }}>{isEn ? "Optional — helps us calibrate your formula." : "Opcional — nos ayuda a calibrar tu fórmula."}</p>
        <input type="text" value={answers.personalBest ?? ""} onChange={e => upd("personalBest", e.target.value)}
          placeholder={isEn ? "e.g. 3:45:00" : "ej. 3:45:00"}
          className="w-full px-3 py-2 rounded-lg text-sm mb-6"
          style={{ background: "var(--surface-2)", border: "1px solid var(--line)", color: "var(--ink)" }}/>
        <Button className="w-full" onClick={() => setPhase("profile")}>{isEn ? "Continue →" : "Continuar →"}</Button>
        <button className="w-full mt-3 text-sm" style={{ color: "var(--ink-3)" }} onClick={() => setPhase("profile")}>{isEn ? "Skip" : "Omitir"}</button>
      </Card>
    );
  }

  if (phase === "profile") return (
    <Card onBack={() => { setIdentityStep(3); setPhase("identity"); }}>
      <p className="text-xs uppercase tracking-[0.4em] mb-4" style={{ color: "var(--ink-3)" }}>{isEn ? "Here's you as an athlete" : "Así eres tú como atleta"}</p>
      <div className="flex items-start gap-6 mb-6">
        <div className="flex-1">
          <h2 className="text-2xl font-bold">{answers.name || (isEn ? "Athlete" : "Atleta")}</h2>
          <div className="mt-2 space-y-1">
            {answers.age && <p className="text-sm" style={{ color: "var(--ink-2)" }}>{answers.age} {isEn ? "years old" : "años"}</p>}
            <p className="text-sm capitalize" style={{ color: "var(--ink-2)" }}>{SPORTS.find(s => s.v === answers.sportType)?.[isEn ? "en" : "es"] ?? answers.sportType}</p>
            {answers.personalBest && <p className="text-sm" style={{ color: "var(--ink-2)" }}>PR: {answers.personalBest}</p>}
          </div>
        </div>
        <div style={{ color: "var(--ink-3)" }}><SportSVG sport={answers.sportType}/></div>
      </div>
      <Button className="w-full" onClick={() => setPhase("goal")}>{isEn ? "→ Add your next goal" : "→ Agregar tu próxima meta"}</Button>
    </Card>
  );

  if (phase === "goal") {
    const raceList = RACE_LISTS[answers.sportType];

    if (goalStep === 0) return (
      <Card onBack={() => setPhase("profile")}>
        <h2 className="text-xl font-semibold mb-6">{isEn ? "What race are you targeting?" : "¿Cuál es tu próxima carrera?"}</h2>
        <div className="grid grid-cols-1 gap-3 mb-4">
          {raceList.map(r => (
            <button key={r} onClick={() => { upd("eventName", r); upd("raceDistance", r); setGoalStep(1); }}
              className="text-left px-4 py-3 rounded-xl transition-all"
              style={{ background: "var(--surface-2)", border: "1px solid var(--line)", color: "var(--ink)" }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--ink-2)")}
              onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--line)")}>{r}</button>
          ))}
        </div>
        <p className="text-xs mb-2" style={{ color: "var(--ink-3)" }}>{isEn ? "Or type your race:" : "O escribe tu carrera:"}</p>
        <input type="text" value={customRace} onChange={e => setCustomRace(e.target.value)}
          placeholder={isEn ? "Race name" : "Nombre de la carrera"}
          className="w-full px-3 py-2 rounded-lg text-sm mb-3"
          style={{ background: "var(--surface-2)", border: "1px solid var(--line)", color: "var(--ink)" }}/>
        {customRace && (
          <Button className="w-full" onClick={() => { upd("eventName", customRace); setGoalStep(1); }}>
            {isEn ? "Use this race →" : "Usar esta carrera →"}
          </Button>
        )}
      </Card>
    );

    if (goalStep === 1) return (
      <Card onBack={() => setGoalStep(0)}>
        <h2 className="text-xl font-semibold mb-2">{isEn ? "When is your race?" : "¿Cuándo es tu carrera?"}</h2>
        <p className="text-sm mb-6" style={{ color: "var(--ink-3)" }}>{answers.eventName}</p>
        <input type="date" value={answers.eventDate} onChange={e => upd("eventDate", e.target.value)}
          className="w-full px-3 py-2 rounded-lg text-sm mb-6"
          style={{ background: "var(--surface-2)", border: "1px solid var(--line)", color: "var(--ink)" }}/>
        <Button className="w-full" onClick={() => setGoalStep(2)} disabled={!answers.eventDate}>
          {isEn ? "Continue →" : "Continuar →"}
        </Button>
        <button className="w-full mt-3 text-sm" style={{ color: "var(--ink-3)" }} onClick={() => setGoalStep(2)}>
          {isEn ? "I'll add this later" : "Lo agrego después"}
        </button>
      </Card>
    );

    return (
      <Card onBack={() => setGoalStep(1)}>
        <h2 className="text-xl font-semibold mb-6">{isEn ? "What are you training for?" : "¿Para qué entrenas?"}</h2>
        <Choices
          opts={[
            { v: "race",     en: "An upcoming race",         es: "Una carrera próxima" },
            { v: "training", en: "General training",         es: "Entrenamiento general" },
            { v: "both",     en: "Training + racing season", es: "Entrenamiento y temporada" },
          ]}
          onPick={v => { upd("goal", v as AssessmentAnswers["goal"]); setPhase("transition"); }}
        />
      </Card>
    );
  }

  if (phase === "transition") return (
    <Card onBack={() => { setGoalStep(2); setPhase("goal"); }}>
      <div className="text-center py-4">
        <div className="text-5xl mb-6">⚗️</div>
        <h2 className="text-2xl font-bold mb-3">{isEn ? "Ready to build your formula?" : "¿Listo para crear tu fórmula?"}</h2>
        <p className="text-sm mb-8" style={{ color: "var(--ink-2)" }}>
          {isEn ? "Now we'll ask the questions that build your personalized nutrition formula." : "Ahora te hacemos las preguntas que arman tu fórmula."}
        </p>
        <Button className="w-full" onClick={() => { setFormulaIdx(0); setPhase("formula"); }}>
          {isEn ? "Build my formula →" : "Crear mi fórmula →"}
        </Button>
      </div>
    </Card>
  );

  function fBack() { formulaIdx === 0 ? setPhase("transition") : setFormulaIdx(i => i - 1); }

  if (curFKey === "carbTargetPerHour") {
    const v = answers.carbTargetPerHour;
    return (
      <Card onBack={fBack}>
        <h2 className="text-xl font-semibold mb-2">{isEn ? "Carbs per hour goal (g)" : "Meta de carbohidratos por hora (g)"}</h2>
        <p className="text-sm mb-6" style={{ color: "var(--ink-3)" }}>{isEn ? "How many grams of carbs per hour do you aim for?" : "¿Cuántos gramos de carbos por hora sueles buscar?"}</p>
        <div className="text-5xl font-black mb-4 text-center" style={{ fontFamily: "var(--font-mono)" }}>{v}<span className="text-lg font-normal ml-1" style={{ color: "var(--ink-3)" }}>g/h</span></div>
        <input type="range" min={30} max={120} step={5} value={v} onChange={e => upd("carbTargetPerHour", Number(e.target.value))} className="w-full accent-current mb-2"/>
        <div className="flex justify-between text-xs mb-6" style={{ color: "var(--ink-3)" }}><span>30g</span><span>120g</span></div>
        <Button className="w-full" onClick={() => formulaNext("carbTargetPerHour", v)}>{isEn ? "Continue →" : "Continuar →"}</Button>
      </Card>
    );
  }

  if (curFKey === "sweatRate") return (
    <Card onBack={fBack}>
      <h2 className="text-xl font-semibold mb-6">{isEn ? "How much do you sweat?" : "¿Cuánto sudas?"}</h2>
      <Choices opts={[{v:"low",en:"Light sweater",es:"Sudo poco"},{v:"medium",en:"Average",es:"Normal"},{v:"high",en:"Heavy sweater",es:"Sudo mucho"}]} onPick={v => formulaNext("sweatRate", v)}/>
    </Card>
  );

  if (curFKey === "caffeineTolerance") return (
    <Card onBack={fBack}>
      <h2 className="text-xl font-semibold mb-6">{isEn ? "How well do you tolerate caffeine?" : "¿Qué tan bien toleras la cafeína?"}</h2>
      <Choices opts={[{v:"none",en:"Can't have it",es:"No puedo tomarlo"},{v:"low",en:"A little is fine",es:"Un poco está bien"},{v:"medium",en:"Moderate",es:"Moderado"},{v:"high",en:"I love caffeine",es:"Me encanta la cafeína"}]} onPick={v => formulaNext("caffeineTolerance", v)}/>
    </Card>
  );

  if (curFKey === "caffeineConsumption") return (
    <Card onBack={fBack}>
      <h2 className="text-xl font-semibold mb-6">{isEn ? "How much caffeine do you drink daily?" : "¿Cuánta cafeína consumes al día?"}</h2>
      <Choices opts={[{v:"none",en:"None",es:"Ninguna"},{v:"occasional",en:"Occasionally",es:"Ocasionalmente"},{v:"daily",en:"Daily (1-2 cups)",es:"Diario (1-2 tazas)"},{v:"heavy",en:"3+ cups/day",es:"3+ tazas/día"}]} onPick={v => formulaNext("caffeineConsumption", v)}/>
    </Card>
  );

  if (curFKey === "caffeineGoal") return (
    <Card onBack={fBack}>
      <h2 className="text-xl font-semibold mb-6">{isEn ? "When do you want caffeine in your mix?" : "¿Cuándo quieres cafeína?"}</h2>
      <Choices opts={[{v:"training_only",en:"Training only",es:"Solo entrenamiento"},{v:"race_only",en:"Race day only",es:"Solo día de carrera"},{v:"both",en:"Both",es:"Ambos"}]} onPick={v => formulaNext("caffeineGoal", v)}/>
    </Card>
  );

  if (curFKey === "fructoseTolerance") return (
    <Card onBack={fBack}>
      <h2 className="text-xl font-semibold mb-2">{isEn ? "How well do you handle fructose?" : "¿Qué tan bien toleras la fructosa?"}</h2>
      <p className="text-sm mb-6" style={{ color: "var(--ink-3)" }}>{isEn ? "Affects your carb ratio (maltodextrin:fructose)." : "Afecta tu proporción de carbos."}</p>
      <Choices opts={[{v:"low",en:"Poorly — gut issues",es:"Mal — malestar estomacal"},{v:"normal",en:"Fine normally",es:"Normal"},{v:"high",en:"Very well",es:"Muy bien"}]} onPick={v => formulaNext("fructoseTolerance", v)}/>
    </Card>
  );

  if (curFKey === "preferredSweetness") return (
    <Card onBack={fBack}>
      <h2 className="text-xl font-semibold mb-6">{isEn ? "How sweet do you like your drinks?" : "¿Qué tan dulce te gustan tus bebidas?"}</h2>
      <Choices opts={[{v:"light",en:"Light — barely sweet",es:"Ligero — apenas dulce"},{v:"regular",en:"Regular",es:"Normal"},{v:"intense",en:"Intense — very sweet",es:"Intenso — muy dulce"}]} onPick={v => formulaNext("preferredSweetness", v)}/>
    </Card>
  );

  const ynLabels: Partial<Record<FormulaKey, { en: string; es: string }>> = {
    hotClimateTraining:         { en: "Do you often train in hot weather?",          es: "¿Entrenas frecuentemente en clima caluroso?" },
    sodiumIssues:               { en: "Do you get cramps or dizziness?",             es: "¿Sufres calambres o mareos?" },
    digestiveIssues:            { en: "Any digestive issues with nutrition?",        es: "¿Tienes problemas digestivos con nutrición?" },
    pastIssuesWithGels:         { en: "Have you had issues with gels?",              es: "¿Has tenido problemas con geles?" },
    pastIssuesWithSportsDrinks: { en: "Issues with sports drinks?",                 es: "¿Problemas con bebidas deportivas?" },
    sugarSensitivity:           { en: "Do you have sugar sensitivity?",              es: "¿Tienes sensibilidad al azúcar?" },
    diabetes:                   { en: "Do you have diabetes?",                       es: "¿Tienes diabetes?" },
  };

  if (curFKey && ynLabels[curFKey]) return (
    <Card onBack={fBack}>
      <h2 className="text-xl font-semibold mb-6">{isEn ? ynLabels[curFKey]!.en : ynLabels[curFKey]!.es}</h2>
      <YesNo onPick={v => formulaNext(curFKey, v)}/>
    </Card>
  );

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
      <p style={{ color: "var(--ink-3)" }}>{isEn ? "Loading…" : "Cargando…"}</p>
    </div>
  );
}
