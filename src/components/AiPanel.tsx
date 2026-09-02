"use client";

import { useState, useEffect, useRef } from "react";
import { AssessmentAnswers, CustomMix } from "@/lib/types";

interface AiPanelProps {
  stage: "formula" | "refine" | "quantity" | "order";
  mix: CustomMix | null;
  answers: AssessmentAnswers;
  lastEdit?: { field: string; value: unknown } | null;
  locale?: "en" | "es";
}

interface Message {
  role: "user" | "ai";
  text: string;
}

function getContextNote(stage: string, mix: CustomMix | null, lastEdit: { field: string; value: unknown } | null, locale: "en" | "es"): string {
  const isEn = locale === "en";
  if (lastEdit) {
    const labels: Record<string, { en: string; es: string }> = {
      carbs:    { en: "carbs per serving", es: "carbohidratos por porción" },
      sodium:   { en: "sodium",            es: "sodio" },
      caffeine: { en: "caffeine",          es: "cafeína" },
      ratio:    { en: "carb ratio",        es: "proporción de carbos" },
    };
    const label = labels[lastEdit.field]?.[locale] ?? lastEdit.field;
    return isEn
      ? `You changed ${label} to ${lastEdit.value}. This affects your energy delivery.`
      : `Cambiaste ${label} a ${lastEdit.value}. Esto afecta tu entrega de energía.`;
  }
  if (!mix) return "";
  if (stage === "formula") {
    const r = mix.reasoning.find(x => x.field === "carbs");
    return r?.explanation[locale] ?? "";
  }
  if (stage === "refine") {
    const r = mix.reasoning.find(x => x.field === "sodium");
    return r?.explanation[locale] ?? "";
  }
  if (stage === "quantity" || stage === "order") {
    return mix.reasoning.map(r => r.explanation[locale]).join(" ");
  }
  return "";
}

export function AiPanel({ stage, mix, answers, lastEdit = null, locale = "es" }: AiPanelProps) {
  const isEn = locale === "en";
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const contextNote = getContextNote(stage, mix, lastEdit, locale);

  useEffect(() => {
    if (contextNote) {
      setMessages([{ role: "ai", text: contextNote }]);
    }
  }, [stage, lastEdit?.field]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send() {
    if (!input.trim()) return;
    const question = input.trim();
    setInput("");
    setMessages(m => [...m, { role: "user", text: question }]);
    setLoading(true);
    try {
      const res = await fetch("/api/ai-explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage, mix, answers, question, locale }),
      });
      const data = await res.json();
      setMessages(m => [...m, { role: "ai", text: data.explanation ?? (isEn ? "I couldn't generate an explanation." : "No pude generar una explicación.") }]);
    } catch {
      setMessages(m => [...m, { role: "ai", text: isEn ? "Connection error. Try again." : "Error de conexión. Intenta de nuevo." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-full rounded-2xl overflow-hidden" style={{ background: "var(--surface)", border: "1px solid var(--line)", minHeight: 320 }}>
      {/* Header */}
      <div className="px-4 py-3 flex items-center gap-2" style={{ borderBottom: "1px solid var(--line)" }}>
        <div className="w-2 h-2 rounded-full bg-green-500" />
        <span className="text-sm font-medium" style={{ fontFamily: "var(--font-mono)" }}>
          {isEn ? "Zenit AI" : "IA Zenit"}
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ maxHeight: 400 }}>
        {messages.length === 0 && !loading && (
          <p className="text-sm" style={{ color: "var(--ink-3)" }}>
            {isEn ? "Ask me anything about your formula." : "Pregúntame lo que quieras sobre tu fórmula."}
          </p>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`text-sm leading-relaxed ${m.role === "user" ? "text-right" : ""}`}>
            <span
              className="inline-block px-3 py-2 rounded-xl"
              style={m.role === "ai"
                ? { background: "var(--surface-2)", color: "var(--ink)" }
                : { background: "var(--ink)", color: "var(--bg)" }}
            >
              {m.text}
            </span>
          </div>
        ))}
        {loading && (
          <div className="text-sm" style={{ color: "var(--ink-3)" }}>
            <span className="inline-block px-3 py-2 rounded-xl" style={{ background: "var(--surface-2)" }}>
              {isEn ? "Thinking…" : "Pensando…"}
            </span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex gap-2 p-3" style={{ borderTop: "1px solid var(--line)" }}>
        <input
          className="flex-1 text-sm px-3 py-2 rounded-lg outline-none"
          style={{ background: "var(--surface-2)", border: "1px solid var(--line)", color: "var(--ink)" }}
          placeholder={isEn ? "Ask about your formula…" : "Pregunta sobre tu fórmula…"}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
        />
        <button
          onClick={send}
          disabled={loading || !input.trim()}
          className="px-3 py-2 rounded-lg text-sm font-medium transition-opacity disabled:opacity-40"
          style={{ background: "var(--ink)", color: "var(--bg)" }}
        >
          →
        </button>
      </div>
    </div>
  );
}
