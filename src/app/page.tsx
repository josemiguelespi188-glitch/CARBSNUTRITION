"use client";

import Link from "next/link";
import { useLocale } from "@/lib/i18n/context";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardTitle } from "@/components/ui/card";

export default function Home() {
  const { t } = useLocale();

  return (
    <div className="flex flex-col flex-1 bg-bg">
      <SiteHeader />

      {/* HERO */}
      <section className="relative flex flex-col items-center justify-center px-6 pt-40 pb-28 text-center overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_-10%,rgba(169,51,26,0.07),transparent_60%)]" />
        <p className="text-xs uppercase tracking-[0.4em] text-ink-3">{t.hero.eyebrow}</p>
        <h1
          className="mt-5 max-w-3xl text-4xl sm:text-6xl font-bold tracking-tight leading-[1.05] text-ink"
          style={{ fontFamily: "var(--font-jetbrains-mono, 'JetBrains Mono', monospace)" }}
        >
          {t.hero.title}
        </h1>
        <p className="mt-6 max-w-xl text-base sm:text-lg text-ink-2 leading-relaxed">
          {t.hero.subtitle}
        </p>
        <div className="mt-9 flex flex-col items-center gap-3">
          <Link href="/assessment">
            <Button variant="accent" size="lg">{t.hero.cta}</Button>
          </Link>
          <span className="text-xs text-ink-3 tracking-wide">{t.hero.secondary}</span>
        </div>
      </section>

      {/* PROBLEM */}
      <section className="border-t border-line px-6 py-24">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-ink">{t.problem.title}</h2>
          <p className="mt-5 text-ink-2 leading-relaxed">{t.problem.body}</p>
        </div>
      </section>

      {/* WHY PERSONALIZATION MATTERS */}
      <section className="border-t border-line px-6 py-24 bg-surface-2">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-center text-ink">{t.why.title}</h2>
          <div className="mt-12 grid gap-5 sm:grid-cols-2">
            {t.why.points.map((p) => (
              <Card key={p.h}>
                <CardTitle>{p.h}</CardTitle>
                <CardBody>{p.b}</CardBody>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="border-t border-line px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-center text-ink">{t.how.title}</h2>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {t.how.steps.map((s) => (
              <Card key={s.h} className="text-left">
                <CardTitle>{s.h}</CardTitle>
                <CardBody>{s.b}</CardBody>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* SCIENTIFIC APPROACH */}
      <section className="border-t border-line px-6 py-24 bg-surface-2">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-ink">{t.science.title}</h2>
          <p className="mt-5 text-ink-2 leading-relaxed">{t.science.body}</p>
        </div>
      </section>

      {/* PERFORMANCE BENEFITS */}
      <section className="border-t border-line px-6 py-24">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-center text-ink">{t.benefits.title}</h2>
          <ul className="mt-10 grid gap-4 sm:grid-cols-2">
            {t.benefits.items.map((item) => (
              <li key={item} className="flex items-start gap-3 rounded-xl border border-line bg-surface px-5 py-4 text-sm text-ink-2">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-1" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="border-t border-line px-6 py-24 bg-surface-2">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-center text-ink">{t.testimonials.title}</h2>
          <div className="mt-12 grid gap-5 sm:grid-cols-3">
            {t.testimonials.items.map((item) => (
              <Card key={item.quote} className="text-left">
                <p className="text-ink-2 italic leading-relaxed">&ldquo;{item.quote}&rdquo;</p>
                <p className="mt-4 text-xs uppercase tracking-widest text-ink-3">{item.name}</p>
              </Card>
            ))}
          </div>
          <p className="mt-6 text-center text-xs text-ink-3">{t.testimonials.note}</p>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-line px-6 py-24">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-center text-ink">{t.faq.title}</h2>
          <div className="mt-10 divide-y divide-line border-y border-line">
            {t.faq.items.map((item) => (
              <details key={item.q} className="group py-5">
                <summary className="cursor-pointer list-none flex items-center justify-between text-sm sm:text-base font-medium text-ink">
                  {item.q}
                  <span className="ml-4 text-ink-3 transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-sm text-ink-2 leading-relaxed">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="border-t border-line px-6 py-28 text-center bg-surface-2">
        <h2 className="mx-auto max-w-2xl text-2xl sm:text-4xl font-semibold tracking-tight leading-tight text-ink">
          {t.finalCta.title}
        </h2>
        <Link href="/assessment" className="mt-8 inline-block">
          <Button variant="accent" size="lg">{t.finalCta.cta}</Button>
        </Link>
      </section>

      <footer className="border-t border-line px-6 py-10">
        <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-ink-3">
          <span
            className="font-bold tracking-[0.25em]"
            style={{ fontFamily: "var(--font-jetbrains-mono, 'JetBrains Mono', monospace)" }}
          >
            {t.brand.name}
          </span>
          <span>{t.footer.rights}</span>
          <span className="text-center sm:text-right">{t.footer.disclaimer}</span>
        </div>
      </footer>
    </div>
  );
}
