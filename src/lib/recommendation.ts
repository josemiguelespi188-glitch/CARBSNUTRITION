import {
  AssessmentAnswers,
  CustomMix,
  FormulaRecommendation,
  PackRecommendation,
  ReasoningEntry,
} from "./types";

/**
 * CARBYN Formula Recommendation Engine
 *
 * Deterministic rules engine that converts an athlete's assessment answers
 * into a starting formula. This is the "v1 brain" — structured so that the
 * same inputs/outputs can later be routed through a Claude model that
 * reasons over the same signals (see lib/ai.ts).
 */

function clampCarbs(g: number): FormulaRecommendation["carbsPerServing"] {
  const steps = [25, 50, 75, 100, 125, 150] as const;
  return steps.reduce((closest, step) =>
    Math.abs(step - g) < Math.abs(closest - g) ? step : closest
  , steps[0]);
}

function clampSodium(mg: number): FormulaRecommendation["sodiumPerServing"] {
  const steps = [200, 400, 600, 800, 1000] as const;
  return steps.reduce((closest, step) =>
    Math.abs(step - mg) < Math.abs(closest - mg) ? step : closest
  , steps[0]);
}

function clampCaffeine(mg: number): FormulaRecommendation["caffeinePerServing"] {
  const steps = [0, 25, 50, 75, 100] as const;
  return steps.reduce((closest, step) =>
    Math.abs(step - mg) < Math.abs(closest - mg) ? step : closest
  , steps[0]);
}

export function buildRecommendation(a: AssessmentAnswers): FormulaRecommendation {
  const reasoning: ReasoningEntry[] = [];

  // ---- CARBS ----
  // Base on athlete's stated need, weighted by event distance/duration profile.
  let carbsBase = a.carbTargetPerHour || 60;
  const longEvents: AssessmentAnswers["sportType"][] = ["ironman", "ultra", "trail"];
  if (longEvents.includes(a.sportType)) carbsBase += 15;
  if (a.sportType === "marathon" || a.sportType === "triathlon") carbsBase += 5;
  if (a.goal === "race") carbsBase += 10;
  if (a.digestiveIssues === "yes" || a.pastIssuesWithGels === "yes") carbsBase -= 15;
  const carbsPerServing = clampCarbs(carbsBase / 2); // serving ~ half-hour dose

  reasoning.push({
    field: "carbs",
    explanation: {
      en: `We set ${carbsPerServing}g of carbs per serving based on your ${a.sportType} profile and a target of roughly ${a.carbTargetPerHour}g/hour. ${
        a.digestiveIssues === "yes" || a.pastIssuesWithGels === "yes"
          ? "Because you reported gut sensitivity with gels, we kept the per-serving dose moderate so you can sip more frequently without GI distress."
          : "This dose lets you fuel consistently without overloading your gut in a single serving."
      }`,
      es: `Definimos ${carbsPerServing}g de carbohidratos por porción según tu perfil de ${a.sportType} y un objetivo de aproximadamente ${a.carbTargetPerHour}g/hora. ${
        a.digestiveIssues === "yes" || a.pastIssuesWithGels === "yes"
          ? "Como reportaste sensibilidad digestiva con geles, mantuvimos la dosis moderada para que puedas tomar con más frecuencia sin malestar estomacal."
          : "Esta dosis te permite fuelearte de forma constante sin sobrecargar tu sistema digestivo de una sola vez."
      }`,
    },
  });

  // ---- SODIUM ----
  let sodiumBase = 400;
  if (a.sweatRate === "medium") sodiumBase = 600;
  if (a.sweatRate === "high") sodiumBase = 800;
  if (a.hotClimateTraining === "yes") sodiumBase += 200;
  if (a.sodiumIssues === "yes") sodiumBase += 100;
  const sodiumPerServing = clampSodium(sodiumBase);

  reasoning.push({
    field: "sodium",
    explanation: {
      en: `Your sodium target is ${sodiumPerServing}mg per serving. This reflects a ${a.sweatRate} sweat rate${
        a.hotClimateTraining === "yes" ? ", regular heat exposure," : ""
      }${a.sodiumIssues === "yes" ? ", and a history of cramping or sodium-related issues" : ""}. The right sodium level helps you retain fluids, prevent cramping, and avoid hyponatremia in long efforts.`,
      es: `Tu objetivo de sodio es ${sodiumPerServing}mg por porción. Esto refleja una tasa de sudoración ${a.sweatRate === "low" ? "baja" : a.sweatRate === "medium" ? "media" : "alta"}${
        a.hotClimateTraining === "yes" ? ", exposición regular al calor," : ""
      }${a.sodiumIssues === "yes" ? " y antecedentes de calambres o problemas de sodio" : ""}. El nivel correcto de sodio ayuda a retener líquidos, prevenir calambres y evitar hiponatremia en esfuerzos largos.`,
    },
  });

  // ---- CAFFEINE ----
  let caffeineBase = 0;
  if (a.caffeineTolerance === "low") caffeineBase = 25;
  if (a.caffeineTolerance === "medium") caffeineBase = 50;
  if (a.caffeineTolerance === "high") caffeineBase = 75;
  if (a.caffeineConsumption === "heavy" && a.caffeineTolerance === "high") caffeineBase = 100;
  if (a.goal === "training") caffeineBase = Math.max(0, caffeineBase - 25);
  const caffeinePerServing = clampCaffeine(caffeineBase);

  reasoning.push({
    field: "caffeine",
    explanation: {
      en: `We landed on ${caffeinePerServing}mg of caffeine per serving based on your ${a.caffeineTolerance} tolerance and ${a.caffeineConsumption} daily intake. ${
        a.goal === "training"
          ? "Because this formula is for training, we trimmed the dose so you don't build tolerance before race day."
          : "This is enough to sharpen focus and reduce perceived effort late in your race without disrupting sleep or causing GI upset."
      }`,
      es: `Llegamos a ${caffeinePerServing}mg de cafeína por porción según tu tolerancia ${a.caffeineTolerance === "none" ? "nula" : a.caffeineTolerance === "low" ? "baja" : a.caffeineTolerance === "medium" ? "media" : "alta"} y tu consumo diario "${a.caffeineConsumption}". ${
        a.goal === "training"
          ? "Como esta fórmula es para entrenamiento, redujimos la dosis para que no generes tolerancia antes del día de la carrera."
          : "Esto es suficiente para mejorar el enfoque y reducir la percepción de esfuerzo en los últimos tramos de tu carrera, sin afectar tu sueño ni tu digestión."
      }`,
    },
  });

  // ---- RATIO ----
  const longDuration = longEvents.includes(a.sportType) || a.trainingHoursPerWeek >= 10;
  const ratio: FormulaRecommendation["ratio"] = longDuration || a.fructoseTolerance === "high" ? "2:1" : "1:0.8";

  reasoning.push({
    field: "ratio",
    explanation: {
      en: `We chose a ${ratio} Malto:Fructose ratio. ${
        ratio === "2:1"
          ? "Dual-source carb blends like this raise your hourly carb absorption ceiling and reduce GI distress during long efforts — ideal for your event profile."
          : "A balanced ratio keeps digestion simple and steady, which fits your training pattern well."
      }`,
      es: `Elegimos una proporción Malto:Fructosa de ${ratio}. ${
        ratio === "2:1"
          ? "Las mezclas de doble fuente de carbohidratos como esta elevan tu capacidad de absorción por hora y reducen molestias digestivas en esfuerzos largos — ideal para tu perfil de evento."
          : "Una proporción balanceada mantiene la digestión simple y estable, lo cual encaja bien con tu patrón de entrenamiento."
      }`,
    },
  });

  // ---- SWEETNESS / FLAVOR STRENGTH ----
  const flavorStrength: FormulaRecommendation["flavorStrength"] =
    a.preferredSweetness === "light" ? "lite" : a.preferredSweetness === "intense" ? "mega" : "regular";

  reasoning.push({
    field: "sweetness",
    explanation: {
      en: `Flavor strength is set to "${flavorStrength}" to match your preference for ${a.preferredSweetness} sweetness${
        a.sugarSensitivity === "yes" ? ", and we accounted for your sugar sensitivity by avoiding an overly sweet profile" : ""
      }.`,
      es: `La intensidad del sabor está en "${flavorStrength}" para coincidir con tu preferencia de dulzor ${a.preferredSweetness === "light" ? "ligero" : a.preferredSweetness === "intense" ? "intenso" : "regular"}${
        a.sugarSensitivity === "yes" ? ", y consideramos tu sensibilidad al azúcar evitando un perfil demasiado dulce" : ""
      }.`,
    },
  });

  const flavor = a.flavorPreferences[0] || "unflavored";
  reasoning.push({
    field: "flavor",
    explanation: {
      en: `Your primary flavor is "${flavor}" based on your stated preferences.`,
      es: `Tu sabor principal es "${flavor}" según tus preferencias indicadas.`,
    },
  });

  return {
    flavor,
    flavorStrength,
    carbsPerServing,
    sodiumPerServing,
    ratio,
    caffeinePerServing,
    preservatives: "yes",
    scooper: "yes",
    reasoning,
  };
}

/** Detects when a user-edited value deviates meaningfully from the recommendation. */
export function getEditWarnings(
  recommendation: FormulaRecommendation,
  edited: Pick<FormulaRecommendation, "caffeinePerServing" | "sodiumPerServing" | "carbsPerServing">
): ReasoningEntry["field"][] {
  const warnings: ReasoningEntry["field"][] = [];
  if (edited.caffeinePerServing > recommendation.caffeinePerServing + 25) warnings.push("caffeine");
  if (edited.sodiumPerServing > recommendation.sodiumPerServing + 200) warnings.push("sodium");
  if (Math.abs(edited.carbsPerServing - recommendation.carbsPerServing) >= 50) warnings.push("carbs");
  return warnings;
}

export const editWarningCopy: Record<ReasoningEntry["field"], { en: string; es: string }> = {
  caffeine: {
    en: "Your caffeine intake is above the recommended level based on your profile. High doses can cause jitteriness or disrupt sleep — consider testing this in training before race day.",
    es: "Tu consumo de cafeína está por encima del nivel recomendado para tu perfil. Dosis altas pueden causar nerviosismo o afectar tu sueño — te recomendamos probarlo en entrenamiento antes del día de la carrera.",
  },
  sodium: {
    en: "This sodium level is significantly higher than your recommendation. Excess sodium can cause GI discomfort — make sure this matches your real sweat losses.",
    es: "Este nivel de sodio es considerablemente más alto que tu recomendación. El exceso de sodio puede causar molestias digestivas — asegúrate de que coincide con tus pérdidas reales por sudor.",
  },
  carbs: {
    en: "This carb amount is far from your recommended dose. Large changes can affect digestion — adjust gradually and test in training.",
    es: "Esta cantidad de carbohidratos se aleja bastante de tu dosis recomendada. Cambios grandes pueden afectar tu digestión — ajusta de forma gradual y pruébalo en entrenamiento.",
  },
  ratio: { en: "", es: "" },
  flavor: { en: "", es: "" },
  sweetness: { en: "", es: "" },
};

/** Pack-size / bundle recommendation based on training load and goal horizon. */
export function buildPackRecommendation(a: AssessmentAnswers): PackRecommendation {
  const weeksToEvent = a.eventDate
    ? Math.max(1, Math.round((new Date(a.eventDate).getTime() - Date.now()) / (7 * 24 * 60 * 60 * 1000)))
    : 12;

  const sessionsPerWeek = Math.max(1, Math.round(a.trainingHoursPerWeek / 1.5));
  const servingsRaw = sessionsPerWeek * weeksToEvent;
  const servings = Math.min(120, Math.max(20, Math.round(servingsRaw / 10) * 10));

  const bundleRaceFormula = a.goal === "both" || (a.goal === "race" && !!a.eventName);

  return {
    servings,
    label: {
      en: `${servings} Scoops — ${weeksToEvent}-Week Training Supply`,
      es: `${servings} Cucharadas — Suministro de ${weeksToEvent} Semanas de Entrenamiento`,
    },
    reasoning: {
      en: `Based on roughly ${sessionsPerWeek} fueled sessions per week over your ${weeksToEvent}-week build${
        a.eventName ? ` toward ${a.eventName}` : ""
      }, this supply keeps you covered without over-buying.`,
      es: `Con base en aproximadamente ${sessionsPerWeek} sesiones fueleadas por semana durante tu preparación de ${weeksToEvent} semanas${
        a.eventName ? ` hacia ${a.eventName}` : ""
      }, este suministro te cubre sin que compres de más.`,
    },
    bundleRaceFormula,
  };
}

const motivationalLines = {
  en: [
    (event: string) => `Stay consistent. Your strongest ${event || "race"} is ahead.`,
    (event: string) => `Every scoop is a step closer to your best ${event || "performance"}.`,
    (event: string) => `Built for the version of you that shows up on ${event ? `${event} ` : ""}race day.`,
    () => `Trust the work. Trust the fuel. Go run it down.`,
  ],
  es: [
    (event: string) => `Mantente constante. Tu mejor ${event || "carrera"} está por venir.`,
    (event: string) => `Cada cucharada te acerca a tu mejor ${event || "rendimiento"}.`,
    (event: string) => `Hecho para la versión de ti que aparece el día de ${event || "la carrera"}.`,
    () => `Confía en el trabajo. Confía en tu fuel. Ve por ello.`,
  ],
};

export function buildMotivationalMessage(athleteName: string, eventName: string): { en: string; es: string } {
  const idx = Math.floor(Math.random() * motivationalLines.en.length);
  return {
    en: motivationalLines.en[idx](eventName),
    es: motivationalLines.es[idx](eventName),
  };
}

export function assembleCustomMix(a: AssessmentAnswers): CustomMix {
  const recommendation = buildRecommendation(a);
  const firstName = a.name.split(" ")[0] || a.name;
  return {
    ...recommendation,
    athleteName: a.name,
    packageLabel: `${firstName}'s Custom Fuel`,
    motivationalMessage: buildMotivationalMessage(firstName, a.eventName),
    warnings: [],
  };
}
