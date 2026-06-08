"use client";

import Link from "next/link";
import { useLocale } from "@/lib/i18n/context";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardTitle } from "@/components/ui/card";

export default function Home() {
  const { t } = useLocale();

  return (
    <div className="flex flex-col flex-1 bg-black">
      <SiteHeader />

      {/* HERO — the assessment is the product, so it's the hero */}
      <section className="relative flex flex-col items-center justify-center px-6 pt-40 pb-28 text-center overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_-10%,rgba(255,255,255,0.08),transparent_60%)]" />
        <p className="text-xs uppercase tracking-[0.4em] text-neutral-500">{t.hero.eyebrow}</p>
        <h1 className="mt-5 max-w-3xl text-4xl sm:text-6xl font-bold tracking-tight leading-[1.05]">
          {t.hero.title}
        </h1>
        <p className="mt-6 max-w-xl text-base sm:text-lg text-neutral-400 leading-relaxed">
          {t.hero.subtitle}
        </p>
        <div className="mt-9 flex flex-col items-center gap-3">
          <Link href="/assessment">
            <Button size="lg">{t.hero.cta}</Button>
          </Link>
          <span className="text-xs text-neutral-500 tracking-wide">{t.hero.secondary}</span>
        </div>
      </section>

      {/* PROBLEM */}
      <section className="border-t border-neutral-900 px-6 py-24">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">{t.problem.title}</h2>
          <p className="mt-5 text-neutral-400 leading-relaxed">{t.problem.body}</p>
        </div>
      </section>

      {/* WHY PERSONALIZATION MATTERS */}
      <section className="border-t border-neutral-900 px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-center">{t.why.title}</h2>
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
      <section className="border-t border-neutral-900 px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-center">{t.how.title}</h2>
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
      <section className="border-t border-neutral-900 px-6 py-24">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">{t.science.title}</h2>
          <p className="mt-5 text-neutral-400 leading-relaxed">{t.science.body}</p>
        </div>
      </section>

      {/* PERFORMANCE BENEFITS */}
      <section className="border-t border-neutral-900 px-6 py-24">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-center">{t.benefits.title}</h2>
          <ul className="mt-10 grid gap-4 sm:grid-cols-2">
            {t.benefits.items.map((item) => (
              <li key={item} className="flex items-start gap-3 rounded-xl border border-neutral-800 px-5 py-4 text-sm text-neutral-300">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-white" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="border-t border-neutral-900 px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-center">{t.testimonials.title}</h2>
          <div className="mt-12 grid gap-5 sm:grid-cols-3">
            {t.testimonials.items.map((item) => (
              <Card key={item.quote} className="text-left">
                <p className="text-neutral-300 italic leading-relaxed">&ldquo;{item.quote}&rdquo;</p>
                <p className="mt-4 text-xs uppercase tracking-widest text-neutral-500">{item.name}</p>
              </Card>
            ))}
          </div>
          <p className="mt-6 text-center text-xs text-neutral-600">{t.testimonials.note}</p>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-neutral-900 px-6 py-24">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-center">{t.faq.title}</h2>
          <div className="mt-10 divide-y divide-neutral-900 border-y border-neutral-900">
            {t.faq.items.map((item) => (
              <details key={item.q} className="group py-5">
                <summary className="cursor-pointer list-none flex items-center justify-between text-sm sm:text-base font-medium text-white">
                  {item.q}
                  <span className="ml-4 text-neutral-500 transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-sm text-neutral-400 leading-relaxed">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="border-t border-neutral-900 px-6 py-28 text-center">
        <h2 className="mx-auto max-w-2xl text-2xl sm:text-4xl font-semibold tracking-tight leading-tight">
          {t.finalCta.title}
        </h2>
        <Link href="/assessment" className="mt-8 inline-block">
          <Button size="lg">{t.finalCta.cta}</Button>
        </Link>
      </section>

      <footer className="border-t border-neutral-900 px-6 py-10">
        <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-neutral-600">
          <span>{t.brand.name} — {t.footer.rights}</span>
          <span className="text-center sm:text-right">{t.footer.disclaimer}</span>
        </div>
      </footer>
    </div>
  );
}
