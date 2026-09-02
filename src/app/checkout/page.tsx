"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLocale } from "@/lib/i18n/context";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { CustomMix } from "@/lib/types";

export default function CheckoutPage() {
  const { locale } = useLocale();
  const router = useRouter();
  const isEn = locale === "en";
  const [mix, setMix] = useState<CustomMix | null>(null);
  const [form, setForm] = useState({ street: "", city: "", state: "", zip: "", country: "US" });
  const [card, setCard] = useState({ number: "", expiry: "", cvv: "", name: "" });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    try {
      const m = sessionStorage.getItem("carbyn:mix");
      if (m) setMix(JSON.parse(m) as CustomMix);
      else router.replace("/mix");
    } catch { router.replace("/mix"); }
  }, [router]);

  function set<K extends keyof typeof form>(k: K, v: string) { setForm(p => ({ ...p, [k]: v })); }
  function setC<K extends keyof typeof card>(k: K, v: string) { setCard(p => ({ ...p, [k]: v })); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await new Promise(r => setTimeout(r, 1400));
    setDone(true);
    setLoading(false);
  }

  const inputCls = "w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink placeholder:text-ink-3 focus:border-ink focus:outline-none transition-colors";

  if (done) return (
    <div className="flex min-h-screen flex-col bg-bg">
      <SiteHeader />
      <main className="flex flex-1 flex-col items-center justify-center px-6 pt-28 pb-16 text-center">
        <div
          className="h-16 w-16 rounded-full flex items-center justify-center mb-6"
          style={{ background: "var(--surface-2)" }}
        >
          <svg viewBox="0 0 24 24" fill="none" className="h-8 w-8"><polyline points="4,12 10,18 20,6" stroke="var(--ink)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-ink">{isEn ? "Order confirmed!" : "¡Pedido confirmado!"}</h1>
        <p className="mt-3 text-ink-3 max-w-sm">
          {isEn ? "We’ll start preparing your formula. Expect an email with tracking details soon." : "Comenzaremos a preparar tu fórmula. Pronto recibirás un correo con los detalles del envío."}
        </p>
        {mix && <p className="mt-2 text-sm font-medium text-ink">{mix.packageLabel}</p>}
        <div className="mt-8 flex gap-3">
          <Link href="/perfil"><Button variant="outline">{isEn ? "View my profile" : "Mi perfil"}</Button></Link>
          <Link href="/"><Button variant="ghost">{isEn ? "Back to home" : "Inicio"}</Button></Link>
        </div>
      </main>
    </div>
  );

  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <SiteHeader />
      <main className="flex flex-1 flex-col items-center px-6 pt-28 pb-16">
        <div className="w-full max-w-lg">
          <Link href="/mix" className="text-xs text-ink-3 hover:text-ink-2 flex items-center gap-1 mb-8">
            <span>←</span> {isEn ? "Back to order" : "Volver al pedido"}
          </Link>

          <h1 className="text-2xl font-semibold tracking-tight text-ink">{isEn ? "Shipping & payment" : "Envío y pago"}</h1>
          {mix && <p className="mt-1 text-sm text-ink-3">{mix.packageLabel}</p>}

          <form onSubmit={handleSubmit} className="mt-8 space-y-8">
            {/* Shipping */}
            <div>
              <p className="text-xs uppercase tracking-widest text-ink-3 mb-4">{isEn ? "Shipping address" : "Dirección de envío"}</p>
              <div className="space-y-3">
                <input required className={inputCls} placeholder={isEn ? "Street address" : "Dirección"} value={form.street} onChange={e => set("street", e.target.value)} />
                <div className="grid grid-cols-2 gap-3">
                  <input required className={inputCls} placeholder={isEn ? "City" : "Ciudad"} value={form.city} onChange={e => set("city", e.target.value)} />
                  <input required className={inputCls} placeholder={isEn ? "State" : "Estado"} value={form.state} onChange={e => set("state", e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input required className={inputCls} placeholder={isEn ? "Zip code" : "Código postal"} value={form.zip} onChange={e => set("zip", e.target.value)} />
                  <input required className={inputCls} placeholder={isEn ? "Country" : "País"} value={form.country} onChange={e => set("country", e.target.value)} />
                </div>
              </div>
            </div>

            {/* Payment */}
            <div>
              <p className="text-xs uppercase tracking-widest text-ink-3 mb-4">{isEn ? "Payment" : "Pago"}</p>
              <div className="space-y-3">
                <input required className={inputCls} placeholder={isEn ? "Name on card" : "Nombre en la tarjeta"} value={card.name} onChange={e => setC("name", e.target.value)} />
                <input required className={inputCls} placeholder="1234 5678 9012 3456" maxLength={19}
                  value={card.number}
                  onChange={e => setC("number", e.target.value.replace(/\D/g,"").replace(/(\d{4})/g,"$1 ").trim())}
                />
                <div className="grid grid-cols-2 gap-3">
                  <input required className={inputCls} placeholder="MM / YY" maxLength={7} value={card.expiry}
                    onChange={e => { const v = e.target.value.replace(/\D/g,""); setC("expiry", v.length >= 2 ? v.slice(0,2) + " / " + v.slice(2,4) : v); }}
                  />
                  <input required className={inputCls} placeholder="CVV" maxLength={4} value={card.cvv} onChange={e => setC("cvv", e.target.value.replace(/\D/g,""))} />
                </div>
              </div>
              <p className="mt-3 text-xs text-ink-3">
                {isEn ? "🔒 Simulated payment — no real charge will be made." : "🔒 Pago simulado — no se hará ningún cargo real."}
              </p>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (isEn ? "Processing…" : "Procesando…") : (isEn ? "Place order" : "Confirmar pedido")}
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
}
