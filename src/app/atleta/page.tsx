"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLocale } from "@/lib/i18n/context";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { AssessmentAnswers, SportType } from "@/lib/types";

function SportSVG({ sport }: { sport: SportType }) {
  const style = { width: 72, height: 72, display: "block" };
  switch (sport) {
    case "marathon":
    case "trail":
      return (
        <svg viewBox="0 0 60 60" style={style} stroke="currentColor" fill="none" strokeWidth="2" strokeLinecap="round">
          <circle cx="30" cy="10" r="5"/>
          <line x1="30" y1="15" x2="30" y2="34"/>
          <line x1="30" y1="22" x2="22" y2="28"/>
          <line x1="30" y1="22" x2="38" y2="28"/>
          <path d="M30 34 L22 48"/>
          <path d="M30 34 L38 48"/>
          {sport === "trail" && <path d="M4 50 Q20 42 30 50 Q40 58 56 50" strokeWidth="1.5" opacity="0.5"/>}
        </svg>
      );
    case "ironman":
    case "triathlon":
      return (
        <svg viewBox="0 0 80 60" style={{ ...style, width: 90 }} stroke="currentColor" fill="none" strokeWidth="2" strokeLinecap="round">
          <circle cx="10" cy="22" r="4"/>
          <path d="M10 26 Q16 30 20 26 Q24 22 14 20"/>
          <circle cx="38" cy="22" r="4"/>
          <circle cx="30" cy="36" r="7"/><circle cx="46" cy="36" r="7"/>
          <path d="M30 36 L38 22 L46 36 L38 30 Z"/>
          <circle cx="66" cy="16" r="4"/>
          <line x1="66" y1="20" x2="66" y2="34"/>
          <path d="M66 34 L60 46"/><path d="M66 34 L72 46"/>
          <line x1="66" y1="26" x2="60" y2="30"/><line x1="66" y1="26" x2="72" y2="30"/>
        </svg>
      );
    case "cycling":
      return (
        <svg viewBox="0 0 60 60" style={style} stroke="currentColor" fill="none" strokeWidth="2" strokeLinecap="round">
          <circle cx="16" cy="42" r="12"/><circle cx="44" cy="42" r="12"/>
          <path d="M30 30 L16 42 L44 42 L30 30"/>
          <circle cx="30" cy="18" r="5"/>
          <path d="M30 23 L30 30"/><path d="M25 28 L35 28"/>
          <path d="M44 30 L36 24"/>
        </svg>
      );
    case "ultra":
      return (
        <svg viewBox="0 0 60 60" style={style} stroke="currentColor" fill="none" strokeWidth="2" strokeLinecap="round">
          <circle cx="30" cy="10" r="5"/>
          <line x1="30" y1="15" x2="30" y2="34"/>
          <line x1="30" y1="22" x2="22" y2="28"/><line x1="30" y1="22" x2="38" y2="28"/>
          <path d="M30 34 L22 48"/><path d="M30 34 L38 48"/>
          <rect x="31" y="16" width="10" height="14" rx="3"/>
          <line x1="31" y1="20" x2="41" y2="20"/>
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 60 60" style={style} stroke="currentColor" fill="none" strokeWidth="2" strokeLinecap="round">
          <polygon points="30,5 36,22 54,22 40,33 46,50 30,40 14,50 20,33 6,22 24,22"/>
        </svg>
      );
  }
}

const SPORT_LABELS: Record<SportType, { en: string; es: string }> = {
  marathon:  { en: "Marathon",      es: "Maratón" },
  ironman:   { en: "Ironman",       es: "Ironman" },
  triathlon: { en: "Triathlon",     es: "Triatlón" },
  cycling:   { en: "Cycling",       es: "Ciclismo" },
  ultra:     { en: "Ultra Running", es: "Ultra Running" },
  trail:     { en: "Trail Running", es: "Trail Running" },
  other:     { en: "Other",         es: "Otro" },
};

export default function AtletaPage() {
  const { locale } = useLocale();
  const isEn = locale === "en";
  const [answers, setAnswers] = useState<AssessmentAnswers | null>(null);

  useEffect(() => {
    try {
      const a = sessionStorage.getItem("carbyn:answers");
      if (a) setAnswers(JSON.parse(a) as AssessmentAnswers);
    } catch { /* ignore */ }
  }, []);

  if (!answers) {
    return (
      <div className="min-h-screen flex flex-col bg-bg">
        <SiteHeader />
        <main className="flex-1 flex items-center justify-center px-6">
          <div className="text-center max-w-sm">
            <p className="text-ink-3 mb-6">{isEn ? "No athlete profile found." : "No se encontró perfil de atleta."}</p>
            <Link href="/assessment"><Button>{isEn ? "Start assessment" : "Hacer diagnóstico"}</Button></Link>
          </div>
        </main>
      </div>
    );
  }

  const sport = answers.sportType as SportType;
  const sportLabel = SPORT_LABELS[sport]?.[isEn ? "en" : "es"] ?? sport;
  const eventDate = answers.eventDate ? new Date(answers.eventDate) : null;
  const today = new Date();
  const daysToEvent = eventDate ? Math.max(0, Math.floor((eventDate.getTime() - today.getTime()) / 86400000)) : null;

  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <SiteHeader />
      <main className="flex-1 px-6 pt-28 pb-24">
        <div className="mx-auto max-w-2xl">
          <Link href="/perfil" className="text-xs text-ink-3 hover:text-ink-2 mb-8 inline-block">
            ← {isEn ? "Back to profile" : "Volver al perfil"}
          </Link>

          <div className="rounded-2xl border border-line bg-surface p-8 mb-6">
            <div className="flex items-start justify-between gap-6">
              <div className="flex-1">
                <p className="text-xs uppercase tracking-[0.4em] text-ink-3 mb-2">
                  {isEn ? "Athlete profile" : "Perfil del atleta"}
                </p>
                <h1 className="text-3xl font-bold text-ink mb-1"
                  style={{ fontFamily: "var(--font-jetbrains-mono,'JetBrains Mono',monospace)" }}>
                  {answers.name || (isEn ? "Athlete" : "Atleta")}
                </h1>
                <p className="text-sm text-ink-3">{answers.email}</p>
                <div className="mt-6 space-y-2">
                  <div className="flex gap-6">
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-ink-3">{isEn ? "Sport" : "Deporte"}</p>
                      <p className="text-sm font-medium text-ink mt-0.5">{sportLabel}</p>
                    </div>
                    {answers.age && (
                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-ink-3">{isEn ? "Age" : "Edad"}</p>
                        <p className="text-sm font-medium text-ink mt-0.5">{answers.age}</p>
                      </div>
                    )}
                  </div>
                  {answers.personalBest && (
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-ink-3">PR</p>
                      <p className="text-sm font-medium text-ink mt-0.5">{answers.personalBest}</p>
                    </div>
                  )}
                </div>
              </div>
              <div className="text-ink-3 shrink-0">
                <SportSVG sport={sport} />
              </div>
            </div>
          </div>

          {(answers.eventName || answers.eventDate) && (
            <div className="rounded-2xl border border-line bg-surface p-6 mb-6">
              <p className="text-xs uppercase tracking-widest text-ink-3 mb-4">{isEn ? "Next Goal" : "Próxima Meta"}</p>
              <div className="flex items-start justify-between">
                <div>
                  {answers.eventName && <p className="font-semibold text-ink">{answers.eventName}</p>}
                  {answers.raceDistance && <p className="text-sm text-ink-3 mt-0.5">{answers.raceDistance}</p>}
                  {eventDate && (
                    <p className="text-sm text-ink-3 mt-1">
                      {eventDate.toLocaleDateString(isEn ? "en-US" : "es", { year: "numeric", month: "long", day: "numeric" })}
                    </p>
                  )}
                </div>
                {daysToEvent !== null && (
                  <div className="text-right">
                    <span className="text-3xl font-black" style={{ color: daysToEvent <= 14 ? "#E8946A" : "var(--ink)", fontFamily: "var(--font-jetbrains-mono,'JetBrains Mono',monospace)" }}>
                      {daysToEvent}
                    </span>
                    <p className="text-xs uppercase tracking-widest text-ink-3">{isEn ? "days" : "días"}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-3">
            <Link href="/assessment"><Button variant="outline" className="w-full">{isEn ? "Edit profile →" : "Editar perfil →"}</Button></Link>
            <Link href="/mix"><Button className="w-full">{isEn ? "Build / edit formula →" : "Crear / editar fórmula →"}</Button></Link>
            <Link href="/perfil"><Button variant="ghost" className="w-full">{isEn ? "View full profile" : "Ver perfil completo"}</Button></Link>
          </div>
        </div>
      </main>
    </div>
  );
}
