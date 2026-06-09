"use client";

import { useMemo } from "react";

const COUNTRY_CODES = [
  { code: "US", dial: "+1" },
  { code: "MX", dial: "+52" },
  { code: "EC", dial: "+593" },
  { code: "ES", dial: "+34" },
  { code: "GB", dial: "+44" },
  { code: "DE", dial: "+49" },
  { code: "FR", dial: "+33" },
  { code: "IT", dial: "+39" },
  { code: "BR", dial: "+55" },
  { code: "AR", dial: "+54" },
  { code: "CL", dial: "+56" },
  { code: "CO", dial: "+57" },
  { code: "PE", dial: "+51" },
];

/**
 * Simple SSR-safe phone input: a country dial-code dropdown plus a number field.
 * The combined value ("+52 5512345678") is stored as a single string.
 */
export function PhoneInput({
  value,
  onChange,
  locale,
}: {
  value: string;
  onChange: (v: string) => void;
  locale: "en" | "es";
}) {
  const { dial, rest } = useMemo(() => {
    const match = COUNTRY_CODES.map((c) => c.dial)
      .sort((a, b) => b.length - a.length)
      .find((d) => value.startsWith(d));
    if (match) return { dial: match, rest: value.slice(match.length).trim() };
    return { dial: "+1", rest: value };
  }, [value]);

  function setDial(newDial: string) {
    onChange(`${newDial} ${rest}`.trim());
  }
  function setRest(newRest: string) {
    onChange(`${dial} ${newRest.replace(/[^\d\s-]/g, "")}`.trim());
  }

  return (
    <div className="flex gap-2">
      <select
        value={dial}
        onChange={(e) => setDial(e.target.value)}
        className="rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-3 text-base text-white focus:border-white focus:outline-none"
      >
        {COUNTRY_CODES.map((c) => (
          <option key={c.code} value={c.dial} className="bg-neutral-950">
            {c.code} {c.dial}
          </option>
        ))}
      </select>
      <input
        type="tel"
        inputMode="tel"
        value={rest}
        onChange={(e) => setRest(e.target.value)}
        placeholder={locale === "en" ? "Phone number" : "Número de teléfono"}
        className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 text-base text-white placeholder:text-neutral-600 focus:border-white focus:outline-none transition-colors"
      />
    </div>
  );
}
