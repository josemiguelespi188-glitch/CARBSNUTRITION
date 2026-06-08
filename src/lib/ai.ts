import Anthropic from "@anthropic-ai/sdk";
import { AssessmentAnswers, FormulaRecommendation } from "./types";

let cachedClient: Anthropic | null = null;

function getClient(): Anthropic | null {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  if (!cachedClient) cachedClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return cachedClient;
}

const SYSTEM_PROMPT = `You are CARBYN's sports nutrition AI advisor. You explain personalized
endurance fueling formulas to athletes in a tone that is professional, scientific, and easy
to understand. You reference the athlete's own assessment answers and their current formula
values. Keep answers concise (3-6 sentences), avoid medical claims, and recommend athletes
test changes in training before race day. Respond in the language of the user's question
(English or Spanish).`;

export interface AiChatContext {
  answers: AssessmentAnswers;
  formula: FormulaRecommendation;
  locale: "en" | "es";
}

/**
 * Answers a free-form athlete question about their formula.
 * Falls back to a deterministic, rules-based explanation when no ANTHROPIC_API_KEY
 * is configured (e.g. local development), so the product still works end-to-end.
 */
export async function answerFormulaQuestion(question: string, ctx: AiChatContext): Promise<string> {
  const client = getClient();

  if (!client) {
    return fallbackAnswer(question, ctx);
  }

  const contextSummary = `
Athlete profile:
- Sport: ${ctx.answers.sportType}, Goal: ${ctx.answers.goal}
- Training: ${ctx.answers.trainingHoursPerWeek}h/week, Event: ${ctx.answers.eventName || "n/a"} (${ctx.answers.eventDate || "n/a"})
- Caffeine tolerance: ${ctx.answers.caffeineTolerance}, consumption: ${ctx.answers.caffeineConsumption}
- Sweat rate: ${ctx.answers.sweatRate}, hot climate training: ${ctx.answers.hotClimateTraining}
- Sodium issues: ${ctx.answers.sodiumIssues}, digestive issues: ${ctx.answers.digestiveIssues}
- Fructose tolerance: ${ctx.answers.fructoseTolerance}, sugar sensitivity: ${ctx.answers.sugarSensitivity}

Current formula:
- Carbs: ${ctx.formula.carbsPerServing}g, Sodium: ${ctx.formula.sodiumPerServing}mg
- Caffeine: ${ctx.formula.caffeinePerServing}mg, Ratio: ${ctx.formula.ratio}
- Flavor: ${ctx.formula.flavor} (${ctx.formula.flavorStrength})
`.trim();

  try {
    const message = await client!.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 350,
      temperature: 0.5,
      system: `${SYSTEM_PROMPT}\n\n${contextSummary}`,
      messages: [{ role: "user", content: question }],
    });
    const text = message.content.find((b) => b.type === "text");
    return (text && "text" in text ? text.text.trim() : "") || fallbackAnswer(question, ctx);
  } catch {
    return fallbackAnswer(question, ctx);
  }
}

function fallbackAnswer(question: string, ctx: AiChatContext): string {
  const q = question.toLowerCase();
  const es = ctx.locale === "es";

  if (q.includes("sodi") || q.includes("salt") || q.includes("sal")) {
    return es
      ? `Tu fórmula tiene ${ctx.formula.sodiumPerServing}mg de sodio porque tu tasa de sudoración es "${ctx.answers.sweatRate}"${ctx.answers.hotClimateTraining === "yes" ? " y entrenas en climas cálidos" : ""}. Esto ayuda a reponer lo que pierdes y a prevenir calambres. Si notas hinchazón o malestar, podemos ajustarlo gradualmente.`
      : `Your formula has ${ctx.formula.sodiumPerServing}mg of sodium because your sweat rate is "${ctx.answers.sweatRate}"${ctx.answers.hotClimateTraining === "yes" ? " and you train in hot climates" : ""}. This replaces what you lose and helps prevent cramping. If you notice bloating, we can dial it down gradually.`;
  }
  if (q.includes("caffe") || q.includes("cafe")) {
    return es
      ? `Definimos ${ctx.formula.caffeinePerServing}mg de cafeína según tu tolerancia "${ctx.answers.caffeineTolerance}". Esta dosis está pensada para mejorar tu enfoque sin afectar tu sueño ni causarte molestias. Te recomendamos probarla primero en entrenamiento.`
      : `We set ${ctx.formula.caffeinePerServing}mg of caffeine based on your "${ctx.answers.caffeineTolerance}" tolerance. This dose is designed to sharpen focus without disrupting sleep or causing discomfort. We recommend testing it in training first.`;
  }
  if (q.includes("carb")) {
    return es
      ? `Tu fórmula entrega ${ctx.formula.carbsPerServing}g de carbohidratos por porción, calibrados para tu perfil de ${ctx.answers.sportType} y tu objetivo de aproximadamente ${ctx.answers.carbTargetPerHour}g/hora. Esto busca mantener tu energía estable sin sobrecargar tu digestión.`
      : `Your formula delivers ${ctx.formula.carbsPerServing}g of carbs per serving, calibrated for your ${ctx.answers.sportType} profile and a target of roughly ${ctx.answers.carbTargetPerHour}g/hour. This is designed to keep your energy steady without overloading your gut.`;
  }
  return es
    ? `Buena pregunta. Tu fórmula actual combina ${ctx.formula.carbsPerServing}g de carbohidratos, ${ctx.formula.sodiumPerServing}mg de sodio y ${ctx.formula.caffeinePerServing}mg de cafeína, en proporción ${ctx.formula.ratio} — todo calibrado a partir de tus respuestas sobre ${ctx.answers.sportType}, tu tolerancia y tus sensibilidades. Pregúntame sobre cualquier ingrediente específico y te explico el razonamiento.`
    : `Good question. Your current formula combines ${ctx.formula.carbsPerServing}g of carbs, ${ctx.formula.sodiumPerServing}mg of sodium, and ${ctx.formula.caffeinePerServing}mg of caffeine at a ${ctx.formula.ratio} ratio — all calibrated from your answers about ${ctx.answers.sportType}, your tolerance, and your sensitivities. Ask me about any specific ingredient and I'll walk you through the reasoning.`;
}
