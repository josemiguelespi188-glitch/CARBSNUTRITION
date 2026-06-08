import { AssessmentAnswers, FormulaRecommendation } from "./types";

export interface AiChatContext {
  answers: AssessmentAnswers;
  formula: FormulaRecommendation;
  locale: "en" | "es";
}

/**
 * Simulated AI advisor — returns smart, context-aware answers driven by the
 * athlete's own assessment data. No external API needed for the MVP.
 * Drop-in replacement: swap this function body for a real Claude call when
 * ANTHROPIC_API_KEY is available and billing is active.
 */
export async function answerFormulaQuestion(question: string, ctx: AiChatContext): Promise<string> {
  return simulatedAnswer(question, ctx);
}

function simulatedAnswer(question: string, ctx: AiChatContext): string {
  const q = question.toLowerCase();
  const es = ctx.locale === "es";
  const { formula: f, answers: a } = ctx;

  // Sodium
  if (q.includes("sodi") || q.includes("salt") || q.includes("sal") || q.includes("cramp") || q.includes("calambre")) {
    return es
      ? `Tu fórmula tiene ${f.sodiumPerServing}mg de sodio por porción. Esto se calibró a partir de tu tasa de sudoración "${a.sweatRate === "low" ? "baja" : a.sweatRate === "medium" ? "media" : "alta"}"${a.hotClimateTraining === "yes" ? " y tu entrenamiento habitual en climas calurosos" : ""}. El sodio correcto repone lo que pierdes con el sudor, previene los calambres y evita la hiponatremia en esfuerzos largos. Si lo aumentas demasiado puedes tener retención o malestar digestivo — ajústalo de 200 en 200 y pruébalo en entrenamiento antes de una carrera.`
      : `Your formula contains ${f.sodiumPerServing}mg of sodium per serving, calibrated to your "${a.sweatRate}" sweat rate${a.hotClimateTraining === "yes" ? " and regular hot-climate training" : ""}. The right sodium level replaces what you lose through sweat, prevents cramping, and guards against hyponatremia during long efforts. If you go too high you risk GI discomfort or bloating — adjust in 200mg steps and test in training before race day.`;
  }

  // Caffeine
  if (q.includes("caffe") || q.includes("café") || q.includes("cafe") || q.includes("energy") || q.includes("energía") || q.includes("focus")) {
    return es
      ? `Tu dosis de cafeína es ${f.caffeinePerServing}mg, elegida según tu tolerancia "${a.caffeineTolerance === "none" ? "ninguna" : a.caffeineTolerance === "low" ? "baja" : a.caffeineTolerance === "medium" ? "media" : "alta"}" y tu consumo diario "${a.caffeineConsumption}". ${f.caffeinePerServing === 0 ? "Preferiste ir sin cafeína, lo cual es válido — los carbohidratos solos ya proveen la energía que necesitas." : `Esta cantidad mejora el enfoque y reduce la percepción de esfuerzo en los últimos tramos sin afectar tu sueño ni tu digestión.`} Recuerda que el efecto de la cafeína llega a su pico entre 45 y 60 minutos después de tomarla.`
      : `Your caffeine dose is ${f.caffeinePerServing}mg, selected based on your "${a.caffeineTolerance}" tolerance and "${a.caffeineConsumption}" daily intake. ${f.caffeinePerServing === 0 ? "You opted for no caffeine, which is perfectly valid — carbohydrates alone provide all the energy you need." : `This amount sharpens focus and reduces perceived effort in the final miles without disrupting sleep or digestion.`} Keep in mind caffeine peaks in your bloodstream 45–60 minutes after ingestion.`;
  }

  // Carbs
  if (q.includes("carb") || q.includes("gram") || q.includes("gramo") || q.includes("energía") || q.includes("energy") || q.includes("glucos") || q.includes("glyco")) {
    return es
      ? `Tu mezcla entrega ${f.carbsPerServing}g de carbohidratos por porción, calculados para alcanzar alrededor de ${a.carbTargetPerHour}g/hora si la consumes cada 30 minutos. Para ${a.sportType === "ironman" || a.sportType === "ultra" || a.sportType === "trail" ? "eventos de larga duración como el tuyo" : "tu modalidad"}, los atletas de alto rendimiento suelen necesitar entre 60 y 90g/hora. ${a.digestiveIssues === "yes" ? "Como tienes historial de molestias digestivas, la dosis por porción se mantuvo conservadora — tomarla más frecuente es mejor que tomarla más alta." : "Ajusta la frecuencia de consumo antes de cambiar la dosis por porción."}`
      : `Your mix delivers ${f.carbsPerServing}g of carbs per serving, designed to hit roughly ${a.carbTargetPerHour}g/hour if consumed every 30 minutes. For ${a.sportType === "ironman" || a.sportType === "ultra" || a.sportType === "trail" ? "long-duration events like yours" : "your discipline"}, high-performance athletes typically target 60–90g/hour. ${a.digestiveIssues === "yes" ? "Because you flagged GI sensitivity, the per-serving dose is intentionally conservative — more frequent sips beat higher doses." : "Adjust your intake frequency before changing the per-serving dose."}`;
  }

  // Ratio
  if (q.includes("ratio") || q.includes("proporci") || q.includes("malto") || q.includes("fructo") || q.includes("absorb")) {
    return es
      ? `La proporción Malto:Fructosa de tu mezcla es ${f.ratio}. ${f.ratio === "2:1" ? "Las dos fuentes de carbohidratos usan transportadores intestinales distintos (SGLT-1 para maltodextrina, GLUT-5 para fructosa), lo que eleva tu tasa máxima de absorción a ~90g/hora y reduce el riesgo de molestias digestivas en esfuerzos largos." : "La proporción 1:0.8 mantiene una digestión simple y estable, ideal para sesiones más cortas o si tu tolerancia a la fructosa es más baja."} Cambiar a 2:1 es especialmente recomendable si tu objetivo supera las 3 horas.`
      : `Your Malto:Fructose ratio is ${f.ratio}. ${f.ratio === "2:1" ? "The two carb sources use different intestinal transporters (SGLT-1 for maltodextrin, GLUT-5 for fructose), raising your maximum absorption rate to ~90g/hour and reducing GI distress risk during long efforts." : "The 1:0.8 ratio keeps digestion simple and steady — ideal for shorter sessions or lower fructose tolerance."} Switching to 2:1 is especially valuable for events exceeding 3 hours.`;
  }

  // Flavor / sweetness
  if (q.includes("flavor") || q.includes("sabor") || q.includes("sweet") || q.includes("dulce") || q.includes("taste") || q.includes("gusto")) {
    return es
      ? `Tu sabor elegido es "${f.flavor.replace(/_/g, " ")}" en intensidad "${f.flavorStrength === "lite" ? "lite (50% menos)" : f.flavorStrength === "mega" ? "mega (50% más)" : "regular"}". Esto coincide con tu preferencia de dulzor "${a.preferredSweetness}"${a.sugarSensitivity === "yes" ? " y con tu sensibilidad al azúcar — evitamos perfiles demasiado dulces" : ""}. Si en el primer entrenamiento el sabor resulta muy intenso en calor, bájalo a "lite" — el calor amplifica la percepción del dulzor.`
      : `Your chosen flavor is "${f.flavor.replace(/_/g, " ")}" at "${f.flavorStrength === "lite" ? "lite (50% less)" : f.flavorStrength === "mega" ? "mega (50% more)" : "regular"}" strength. This matches your "${a.preferredSweetness}" sweetness preference${a.sugarSensitivity === "yes" ? " and accounts for your sugar sensitivity — we avoided an overly sweet profile" : ""}. If the flavor feels too intense during your first hot workout, drop it to "lite" — heat amplifies sweetness perception.`;
  }

  // Race / event specific
  if (q.includes("race") || q.includes("carrera") || q.includes("ironman") || q.includes("marathon") || q.includes("maratón") || q.includes("event") || q.includes("evento")) {
    const event = a.eventName || (es ? "tu evento" : "your event");
    return es
      ? `Tu fórmula está pensada para ${a.goal === "race" ? `llevarte al máximo en ${event}` : a.goal === "training" ? "optimizar tus entrenamientos" : `cubrir tanto tus entrenamientos como tu preparación para ${event}`}. La clave en el día de la carrera es no cambiar nada que no hayas probado antes — usa exactamente esta mezcla en tus largos de entrenamiento al menos 3 veces antes del evento. Si el evento tiene condiciones especiales de calor o humedad, considera subir el sodio 200mg.`
      : `Your formula is designed to ${a.goal === "race" ? `peak you for ${event}` : a.goal === "training" ? "optimize your training sessions" : `cover both training and your build toward ${event}`}. The golden rule on race day: don't try anything new — use this exact mix on your long training sessions at least 3 times before the event. If race conditions involve unusual heat or humidity, consider adding 200mg of sodium.`;
  }

  // GI / gut / digestive
  if (q.includes("stomach") || q.includes("gut") || q.includes("gi") || q.includes("digest") || q.includes("nausea") || q.includes("estómago") || q.includes("digestiv") || q.includes("náusea")) {
    return es
      ? `Las molestias digestivas son la causa más común de abandono en resistencia. Tu fórmula ${a.digestiveIssues === "yes" ? "ya tiene la dosis de carbohidratos por porción reducida para proteger tu intestino" : "usa una dosis estándar bien tolerada por la mayoría de atletas"}. Consejo clave: nunca te tomes una dosis completa en un momento de esfuerzo máximo — espera los cambios de ritmo o los descensos. Y siempre acompáñala con agua, nunca con bebida isotónica.`
      : `GI issues are the leading cause of DNFs in endurance sport. Your formula ${a.digestiveIssues === "yes" ? "already has a reduced per-serving carb dose to protect your gut" : "uses a standard dose well-tolerated by most athletes"}. Key tip: never take a full serving at peak effort intensity — wait for a pace change or descent. And always chase it with water, never another carbohydrate drink.`;
  }

  // Generic / anything else
  return es
    ? `Buena pregunta sobre tu fórmula. Tu mezcla personalizada contiene ${f.carbsPerServing}g de carbohidratos, ${f.sodiumPerServing}mg de sodio y ${f.caffeinePerServing}mg de cafeína por porción, en una proporción Malto:Fructosa de ${f.ratio} — todo calculado a partir de tu perfil de ${a.sportType === "ironman" ? "Ironman" : a.sportType === "marathon" ? "maratón" : a.sportType === "ultra" ? "ultra" : a.sportType === "trail" ? "trail" : a.sportType === "cycling" ? "ciclismo" : a.sportType === "triathlon" ? "triatlón" : "atleta"}, tu tolerancia y tus sensibilidades. Pregúntame sobre sodio, cafeína, carbohidratos, la proporción malto:fructosa, el sabor o tu evento específico.`
    : `Great question about your formula. Your personalized mix contains ${f.carbsPerServing}g of carbs, ${f.sodiumPerServing}mg of sodium, and ${f.caffeinePerServing}mg of caffeine per serving at a ${f.ratio} Malto:Fructose ratio — all calculated from your ${a.sportType} profile, tolerance levels, and sensitivities. Ask me about sodium, caffeine, carbs, the malto:fructose ratio, flavor, or your specific event.`;
}
