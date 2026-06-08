export type Locale = "en" | "es";

export const dictionaries = {
  en: {
    nav: { assessment: "Start Assessment", dashboard: "Dashboard", login: "Log In" },
    brand: {
      name: "CARBYN",
      tagline: "Precision fuel. Engineered for you.",
    },
    hero: {
      eyebrow: "Personalized Endurance Fuel",
      title: "Find Your Perfect Fuel Mix",
      subtitle: "Answer a few questions and we'll build your personalized carbohydrate formula — tuned to your physiology, your sport, and your race.",
      cta: "Start Assessment",
      secondary: "Takes about 4 minutes",
    },
    problem: {
      title: "Sports nutrition treats every athlete the same.",
      body: "A marathoner, an Ironman athlete, and a cyclist all reach for the same gel, the same drink mix, the same generic formula — despite having completely different physiology, sweat rates, caffeine tolerance, and gut sensitivity. That's not science. That's guesswork with a label on it.",
    },
    why: {
      title: "Why personalization matters",
      points: [
        { h: "Your sweat isn't standard", b: "Sodium needs vary by 4x between athletes. A generic formula either underfuels you or overloads your gut." },
        { h: "Your gut has a ceiling", b: "Carb absorption capacity differs by athlete and by event distance. The wrong ratio means cramping, bloating, or bonking." },
        { h: "Caffeine isn't one-size-fits-all", b: "What sharpens one athlete's focus keeps another awake at 2am. Tolerance must shape the dose." },
        { h: "Your race isn't generic either", b: "An Ironman and a 10K demand fundamentally different fueling strategies — yours should match the demand." },
      ],
    },
    how: {
      title: "How it works",
      steps: [
        { h: "1. Take the assessment", b: "Answer questions about your sport, physiology, tolerances, and goals. The questions adapt as you go." },
        { h: "2. Get your formula", b: "Our recommendation engine builds a starting formula across carbs, sodium, caffeine, ratio, and flavor." },
        { h: "3. Understand the why", b: "An AI panel explains every choice in plain language — and answers your follow-up questions." },
        { h: "4. Refine and order", b: "Adjust any value in your mix editor, see real-time guidance, and order your personalized supply." },
      ],
    },
    science: {
      title: "Built on exercise science, not guesswork",
      body: "Every recommendation is grounded in published endurance nutrition research — carbohydrate oxidation rates, sodium balance, multi-transportable carbohydrate blends, and caffeine pharmacokinetics — translated into a formula that fits your specific profile.",
    },
    benefits: {
      title: "Performance benefits",
      items: [
        "Steadier energy with fewer GI issues",
        "Sodium dialed to your real sweat losses",
        "Caffeine timed and dosed to your tolerance",
        "A formula that travels with you from training to race day",
      ],
    },
    testimonials: {
      title: "What athletes are saying",
      items: [
        { quote: "First formula that didn't wreck my stomach at mile 20.", name: "Marathon athlete", placeholder: true },
        { quote: "Finally, a sodium dose that matches how much I actually sweat.", name: "Ironman athlete", placeholder: true },
        { quote: "The AI explained exactly why — and I trusted it on race day.", name: "Ultra runner", placeholder: true },
      ],
      note: "Placeholder testimonials — real athlete stories coming soon.",
    },
    faq: {
      title: "Frequently asked questions",
      items: [
        { q: "How is this different from a regular sports drink?", a: "Your formula is built from your specific physiology and event — not a generic recipe sold to everyone." },
        { q: "Can I change my formula later?", a: "Yes. Your dashboard lets you retake the assessment, adjust your mix, and reorder anytime." },
        { q: "Is this safe with diabetes or sugar sensitivity?", a: "We ask about these conditions directly so your formula avoids unsuitable ingredients — always confirm with your physician." },
        { q: "How long does the assessment take?", a: "About 4 minutes. The questions adapt based on your answers, so you only see what's relevant to you." },
      ],
    },
    finalCta: {
      title: "Ready to fuel like it was made for you — because it was.",
      cta: "Start Your Assessment",
    },
    footer: {
      rights: "All rights reserved.",
      disclaimer: "Not medical advice. Consult a sports nutrition professional for individual needs.",
    },
  },
  es: {
    nav: { assessment: "Iniciar Evaluación", dashboard: "Panel", login: "Iniciar Sesión" },
    brand: {
      name: "CARBYN",
      tagline: "Combustible de precisión. Diseñado para ti.",
    },
    hero: {
      eyebrow: "Combustible de Resistencia Personalizado",
      title: "Encuentra tu Mezcla de Combustible Perfecta",
      subtitle: "Responde algunas preguntas y construiremos tu fórmula de carbohidratos personalizada — ajustada a tu fisiología, tu deporte y tu carrera.",
      cta: "Iniciar Evaluación",
      secondary: "Toma alrededor de 4 minutos",
    },
    problem: {
      title: "La nutrición deportiva trata a todos los atletas igual.",
      body: "Un corredor de maratón, un atleta de Ironman y un ciclista usan el mismo gel, la misma bebida, la misma fórmula genérica — a pesar de tener fisiología, tasas de sudoración, tolerancia a la cafeína y sensibilidad digestiva completamente distintas. Eso no es ciencia. Es adivinar con una etiqueta encima.",
    },
    why: {
      title: "Por qué importa la personalización",
      points: [
        { h: "Tu sudor no es estándar", b: "Las necesidades de sodio varían hasta 4 veces entre atletas. Una fórmula genérica te deja corto o sobrecarga tu digestión." },
        { h: "Tu intestino tiene un límite", b: "La capacidad de absorción de carbohidratos varía según el atleta y la distancia del evento. La proporción incorrecta significa calambres, hinchazón o pájara." },
        { h: "La cafeína no es talla única", b: "Lo que agudiza el enfoque de un atleta mantiene despierto a otro a las 2am. La tolerancia debe definir la dosis." },
        { h: "Tu carrera tampoco es genérica", b: "Un Ironman y un 10K exigen estrategias de alimentación fundamentalmente distintas — la tuya debería coincidir con esa exigencia." },
      ],
    },
    how: {
      title: "Cómo funciona",
      steps: [
        { h: "1. Realiza la evaluación", b: "Responde preguntas sobre tu deporte, fisiología, tolerancias y objetivos. Las preguntas se adaptan mientras avanzas." },
        { h: "2. Recibe tu fórmula", b: "Nuestro motor de recomendación construye una fórmula inicial de carbohidratos, sodio, cafeína, proporción y sabor." },
        { h: "3. Entiende el porqué", b: "Un panel de IA explica cada elección en lenguaje claro — y responde tus preguntas adicionales." },
        { h: "4. Ajusta y ordena", b: "Modifica cualquier valor en tu editor de mezcla, recibe orientación en tiempo real, y ordena tu suministro personalizado." },
      ],
    },
    science: {
      title: "Basado en ciencia del ejercicio, no en suposiciones",
      body: "Cada recomendación se basa en investigación publicada sobre nutrición de resistencia — tasas de oxidación de carbohidratos, balance de sodio, mezclas de carbohidratos de múltiple transportador y farmacocinética de la cafeína — traducida en una fórmula que se ajusta a tu perfil específico.",
    },
    benefits: {
      title: "Beneficios de rendimiento",
      items: [
        "Energía más estable con menos problemas digestivos",
        "Sodio ajustado a tus pérdidas reales por sudor",
        "Cafeína dosificada y programada según tu tolerancia",
        "Una fórmula que te acompaña del entrenamiento al día de la carrera",
      ],
    },
    testimonials: {
      title: "Lo que dicen los atletas",
      items: [
        { quote: "La primera fórmula que no me arruinó el estómago en el kilómetro 32.", name: "Atleta de maratón", placeholder: true },
        { quote: "Por fin una dosis de sodio que coincide con lo que realmente sudo.", name: "Atleta de Ironman", placeholder: true },
        { quote: "La IA me explicó exactamente por qué — y confié en ella el día de la carrera.", name: "Corredor de ultra", placeholder: true },
      ],
      note: "Testimonios de muestra — historias reales de atletas próximamente.",
    },
    faq: {
      title: "Preguntas frecuentes",
      items: [
        { q: "¿En qué se diferencia esto de una bebida deportiva normal?", a: "Tu fórmula se construye a partir de tu fisiología y evento específicos — no es una receta genérica vendida a todos." },
        { q: "¿Puedo cambiar mi fórmula después?", a: "Sí. Tu panel te permite repetir la evaluación, ajustar tu mezcla y volver a ordenar cuando quieras." },
        { q: "¿Es seguro si tengo diabetes o sensibilidad al azúcar?", a: "Preguntamos directamente sobre estas condiciones para que tu fórmula evite ingredientes no adecuados — siempre confírmalo con tu médico." },
        { q: "¿Cuánto dura la evaluación?", a: "Alrededor de 4 minutos. Las preguntas se adaptan según tus respuestas, así que solo ves lo que es relevante para ti." },
      ],
    },
    finalCta: {
      title: "Listo para alimentarte como si lo hubieran hecho para ti — porque así fue.",
      cta: "Inicia tu Evaluación",
    },
    footer: {
      rights: "Todos los derechos reservados.",
      disclaimer: "Esto no es consejo médico. Consulta a un profesional de nutrición deportiva para necesidades individuales.",
    },
  },
} as const;

export type Dictionary = (typeof dictionaries)[Locale];
