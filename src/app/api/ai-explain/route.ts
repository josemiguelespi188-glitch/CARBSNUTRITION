import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { stage, mix, answers, question, locale } = await req.json();
  const isEn = locale === "en";

  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (apiKey && question) {
    try {
      const systemPrompt = `You are Zenit AI, a sports nutrition expert assistant for endurance athletes.
The athlete's profile: sport=${answers?.sportType}, goal=${answers?.goal}, training=${answers?.trainingHoursPerWeek}h/week,
caffeine tolerance=${answers?.caffeineTolerance}, sweat rate=${answers?.sweatRate}.
Their formula: ${mix?.carbsPerServing}g carbs, ${mix?.sodiumPerServing}mg sodium, ${mix?.caffeinePerServing}mg caffeine per serving.
Current stage: ${stage}. Respond in ${isEn ? "English" : "Spanish"}. Be concise (2-4 sentences), practical, and supportive.`;

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 256,
          system: systemPrompt,
          messages: [{ role: "user", content: question }],
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const text = data.content?.[0]?.text ?? "";
        return NextResponse.json({ explanation: text });
      }
    } catch { /* fallthrough to deterministic */ }
  }

  // Deterministic fallback
  const explanations: Record<string, { en: string; es: string }> = {
    formula: {
      en: "Your formula was built from your sport, sweat rate, and caffeine tolerance. The carb and sodium levels are optimized for your training load.",
      es: "Tu fórmula fue construida con base en tu deporte, tasa de sudoración y tolerancia a la cafeína. Los niveles de carbos y sodio están optimizados para tu carga de entrenamiento.",
    },
    refine: {
      en: "Adjusting your formula? Each change affects your energy delivery and gut comfort. Make small tweaks and test in training before race day.",
      es: "¿Ajustando tu fórmula? Cada cambio afecta tu entrega de energía y comodidad intestinal. Haz pequeños ajustes y pruébalos en entrenamiento antes de la carrera.",
    },
    quantity: {
      en: "The recommended supply covers your fueled training sessions until your event. Having enough mix ensures consistent practice with your race-day formula.",
      es: "El suministro recomendado cubre tus sesiones de entrenamiento con combustible hasta tu evento. Tener suficiente mezcla garantiza práctica consistente con tu fórmula de carrera.",
    },
    order: {
      en: "You're all set! Your personalized formula is ready. Stick to this nutrition plan in training to build gut tolerance and confidence for race day.",
      es: "¡Todo listo! Tu fórmula personalizada está lista. Mantén este plan de nutrición en el entrenamiento para construir tolerancia intestinal y confianza para el día de la carrera.",
    },
  };

  const fallback = explanations[stage] ?? explanations.formula;
  return NextResponse.json({ explanation: isEn ? fallback.en : fallback.es });
}
