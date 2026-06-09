"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "@/lib/i18n/context";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export default function AuthPage() {
  const { locale } = useLocale();
  const router = useRouter();
  const isEn = locale === "en";
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const inputClasses =
    "w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 text-base text-white placeholder:text-neutral-600 focus:border-white focus:outline-none transition-colors";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      const supabase = createClient();
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setInfo(isEn ? "Account created. Redirecting…" : "Cuenta creada. Redirigiendo…");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : isEn ? "Authentication failed." : "Falló la autenticación.");
    } finally {
      setBusy(false);
    }
  }

  function fillDemo() {
    setMode("signin");
    setEmail("demo@carbyn.app");
    setPassword("carbyn2025");
  }

  return (
    <div className="flex min-h-screen flex-col bg-black">
      <SiteHeader />
      <main className="flex flex-1 flex-col items-center justify-center px-6 pt-28 pb-16">
        <div className="w-full max-w-sm">

          {/* Demo credentials banner */}
          <div className="mb-6 rounded-2xl border border-neutral-800 bg-neutral-950 px-4 py-4">
            <p className="text-xs uppercase tracking-widest text-neutral-500 mb-2">{isEn ? "Demo Access" : "Acceso Demo"}</p>
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm text-neutral-300 leading-relaxed">
                <span className="text-neutral-500">{isEn ? "Email" : "Correo"}:</span> demo@carbyn.app<br />
                <span className="text-neutral-500">{isEn ? "Password" : "Contraseña"}:</span> carbyn2025
              </div>
              <button
                type="button"
                onClick={fillDemo}
                className="shrink-0 rounded-full border border-white px-4 py-2 text-xs text-white hover:bg-white hover:text-black transition-colors"
              >
                {isEn ? "Use demo" : "Usar demo"}
              </button>
            </div>
          </div>

          <div className="mb-8 flex rounded-xl border border-neutral-800 p-1">
            {(["signin", "signup"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 rounded-lg px-4 py-2 text-sm transition-colors ${
                  mode === m ? "bg-white text-black font-medium" : "text-neutral-400 hover:text-white"
                }`}
              >
                {m === "signin" ? (isEn ? "Sign In" : "Iniciar Sesión") : (isEn ? "Sign Up" : "Registrarse")}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="space-y-4">
            <input
              type="email"
              required
              placeholder={isEn ? "Email" : "Correo"}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClasses}
            />
            <input
              type="password"
              required
              minLength={6}
              placeholder={isEn ? "Password" : "Contraseña"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClasses}
            />
            {error && <p className="text-sm text-neutral-300">{error}</p>}
            {info && <p className="text-sm text-neutral-400">{info}</p>}
            <Button type="submit" disabled={busy} className="w-full">
              {busy
                ? (isEn ? "Please wait…" : "Espera…")
                : mode === "signin"
                ? (isEn ? "Sign In" : "Iniciar Sesión")
                : (isEn ? "Create Account" : "Crear Cuenta")}
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
}
