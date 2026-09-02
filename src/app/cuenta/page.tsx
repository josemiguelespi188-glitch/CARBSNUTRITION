"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLocale } from "@/lib/i18n/context";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

const FLAVOR_META: Record<string, { en: string; es: string; color: string }> = {
  peach:     { en: "Peach",     es: "Durazno", color: "#E8946A" },
  kiwi:      { en: "Kiwi",      es: "Kiwi",    color: "#6BAF5E" },
  pineapple: { en: "Pineapple", es: "Piña",    color: "#E8C44A" },
  mango:     { en: "Mango",     es: "Mango",   color: "#E8A040" },
};

export default function CuentaPage() {
  const { locale } = useLocale();
  const router = useRouter();
  const isEn = locale === "en";

  const [flavorKey, setFlavorKey] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "+1 ", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const f = sessionStorage.getItem("zenit:flavor");
      if (f && FLAVOR_META[f]) setFlavorKey(f);
    } catch { /* ignore */ }
  }, []);

  function set(k: keyof typeof form, v: string) {
    setForm((p) => ({ ...p, [k]: v }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { error: signUpError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: { data: { name: form.name, phone: form.phone } },
      });
      if (signUpError && !signUpError.message.includes("already registered")) {
        throw signUpError;
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (!msg.includes("fetch") && !msg.includes("network")) {
        setError(msg);
        setLoading(false);
        return;
      }
      // Network/config error — continue without auth
    }

    try {
      sessionStorage.setItem(
        "zenit:user",
        JSON.stringify({ name: form.name, email: form.email, phone: form.phone })
      );
    } catch { /* ignore */ }

    router.push("/mix");
  }

  const flavor = flavorKey ? FLAVOR_META[flavorKey] : null;
  const inputCls =
    "w-full rounded-xl border border-line bg-surface px-4 py-3 text-base text-ink placeholder:text-ink-3 focus:border-ink focus:outline-none transition-colors";

  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <SiteHeader />
      <main className="flex flex-1 flex-col items-center justify-center px-6 pt-28 pb-16">
        <div className="w-full max-w-md">

          {/* Flavor preview banner */}
          {flavor && flavorKey && (
            <div className="mb-6 flex items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-3">
              <div className="h-6 w-6 rounded-full shrink-0" style={{ background: flavor.color }} />
              <p className="text-sm text-ink-2">
                {isEn ? "Flavor selected:" : "Sabor seleccionado:"}{" "}
                <span className="font-medium text-ink">{isEn ? flavor.en : flavor.es}</span>
              </p>
            </div>
          )}

          <p className="text-xs uppercase tracking-[0.4em] text-ink-3 mb-3">
            {isEn ? "Step 1 of 3" : "Paso 1 de 3"}
          </p>
          <h1
            className="text-3xl sm:text-4xl font-bold tracking-tight text-ink"
            style={{ fontFamily: "var(--font-jetbrains-mono, 'JetBrains Mono', monospace)" }}
          >
            {isEn ? "Create your account." : "Crea tu cuenta."}
          </h1>
          <p className="mt-2 text-sm text-ink-3">
            {isEn ? "Your formula and orders are saved here." : "Tu fórmula y pedidos quedan guardados aquí."}
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div>
              <label className="block text-xs uppercase tracking-widest text-ink-3 mb-2">
                {isEn ? "Full name" : "Nombre completo"}
              </label>
              <input
                required
                type="text"
                className={inputCls}
                placeholder={isEn ? "Maria Garcia" : "María García"}
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-widest text-ink-3 mb-2">
                {isEn ? "Email" : "Correo electrónico"}
              </label>
              <input
                required
                type="email"
                className={inputCls}
                placeholder="maria@example.com"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-widest text-ink-3 mb-2">
                {isEn ? "Phone" : "Teléfono"}
              </label>
              <input
                type="tel"
                className={inputCls}
                placeholder="+1 555 000 0000"
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-widest text-ink-3 mb-2">
                {isEn ? "Password" : "Contraseña"}
              </label>
              <input
                required
                type="password"
                minLength={8}
                className={inputCls}
                placeholder={isEn ? "8+ characters" : "8+ caracteres"}
                value={form.password}
                onChange={(e) => set("password", e.target.value)}
              />
            </div>

            {error && (
              <p className="rounded-xl border border-error bg-surface px-4 py-3 text-sm text-error">
                {error}
              </p>
            )}

            <div className="pt-2">
              <Button type="submit" className="w-full" disabled={loading || !form.name || !form.email || !form.password}>
                {loading
                  ? (isEn ? "Creating account…" : "Creando cuenta…")
                  : (isEn ? "Continue →" : "Continuar →")}
              </Button>
            </div>
          </form>

          <p className="mt-6 text-center text-xs text-ink-3">
            {isEn ? "Already have an account?" : "¿Ya tienes cuenta?"}{" "}
            <Link href="/mix" className="underline underline-offset-4 hover:text-ink-2">
              {isEn ? "Skip to your formula" : "Ir a tu fórmula"}
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
