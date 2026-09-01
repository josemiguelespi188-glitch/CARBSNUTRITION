"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale } from "@/lib/i18n/context";
import { SiteHeader } from "@/components/SiteHeader";
import { Card, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

type Tab = "dashboard" | "athletes" | "config";

interface AssessmentRow {
  id: string;
  name: string;
  email: string;
  created_at: string;
  answers: Record<string, unknown> | null;
}

interface FlavorRow {
  id: string;
  key: string;
  label_en: string;
  label_es: string;
  active: boolean;
}

const signupTrend = [
  { month: "Jan", count: 12 },
  { month: "Feb", count: 19 },
  { month: "Mar", count: 27 },
  { month: "Apr", count: 33 },
  { month: "May", count: 41 },
  { month: "Jun", count: 50 },
];

const DEMO_ASSESSMENTS: AssessmentRow[] = [
  { id: "1", name: "Carlos Méndez", email: "carlos@example.com", created_at: "2026-05-01T10:00:00Z", answers: { sportType: "ironman", eventName: "IRONMAN 70.3 Ecuador" } },
  { id: "2", name: "Sofia Ruiz", email: "sofia@example.com", created_at: "2026-05-03T11:00:00Z", answers: { sportType: "marathon", eventName: "Maratón de Bogotá" } },
  { id: "3", name: "Andrés Torres", email: "andres@example.com", created_at: "2026-05-05T09:30:00Z", answers: { sportType: "cycling", eventName: "La Vuelta Colombia" } },
  { id: "4", name: "Valentina Cruz", email: "vale@example.com", created_at: "2026-05-07T14:00:00Z", answers: { sportType: "triathlon", eventName: "Triatlón Cali" } },
  { id: "5", name: "Marco Jiménez", email: "marco@example.com", created_at: "2026-05-09T08:00:00Z", answers: { sportType: "ultra", eventName: "Ultra Sierra Nevada" } },
  { id: "6", name: "Daniela Mora", email: "daniela@example.com", created_at: "2026-05-11T16:00:00Z", answers: { sportType: "trail", eventName: "Trail de los Andes" } },
  { id: "7", name: "Pablo Herrera", email: "pablo@example.com", created_at: "2026-05-13T10:30:00Z", answers: { sportType: "marathon", eventName: "NYC Marathon" } },
  { id: "8", name: "Isabella Vega", email: "isa@example.com", created_at: "2026-05-15T12:00:00Z", answers: { sportType: "ironman", eventName: "IRONMAN Mexico" } },
  { id: "9", name: "Ricardo Salazar", email: "ricky@example.com", created_at: "2026-05-17T09:00:00Z", answers: { sportType: "cycling", eventName: "Gran Fondo Quito" } },
  { id: "10", name: "Camila Ortiz", email: "camila@example.com", created_at: "2026-05-19T15:00:00Z", answers: { sportType: "triathlon", eventName: "Triatlón Lima" } },
  { id: "11", name: "Juan Pérez", email: "juan@example.com", created_at: "2026-05-21T11:00:00Z", answers: { sportType: "marathon", eventName: "Maratón de Santiago" } },
  { id: "12", name: "Lucía Fernández", email: "lucia@example.com", created_at: "2026-05-23T13:00:00Z", answers: { sportType: "trail", eventName: "Trail Patagonia" } },
  { id: "13", name: "Diego Castillo", email: "diego@example.com", created_at: "2026-05-25T10:00:00Z", answers: { sportType: "ultra", eventName: "100K Montaña" } },
  { id: "14", name: "Ana Vargas", email: "ana@example.com", created_at: "2026-05-27T14:30:00Z", answers: { sportType: "ironman", eventName: "IRONMAN 70.3 Cartagena" } },
  { id: "15", name: "Felipe Rojas", email: "felipe@example.com", created_at: "2026-05-29T09:00:00Z", answers: { sportType: "cycling", eventName: "Tour del Valle" } },
];

const DEMO_FLAVORS: FlavorRow[] = [
  { id: "f1", key: "blue_raspberry", label_en: "Blue Raspberry", label_es: "Blue Raspberry", active: true },
  { id: "f2", key: "lemon_lime", label_en: "Lemon Lime", label_es: "Lemon Lime", active: true },
  { id: "f3", key: "cherry", label_en: "Cherry", label_es: "Cereza", active: true },
  { id: "f4", key: "pineapple", label_en: "Pineapple", label_es: "Piña", active: true },
  { id: "f5", key: "kiwi", label_en: "Kiwi", label_es: "Kiwi", active: true },
  { id: "f6", key: "watermelon", label_en: "Watermelon", label_es: "Sandía", active: true },
  { id: "f7", key: "grape", label_en: "Grape", label_es: "Uva", active: false },
  { id: "f8", key: "green_apple", label_en: "Green Apple", label_es: "Manzana Verde", active: true },
  { id: "f9", key: "mixed_berry", label_en: "Mixed Berry", label_es: "Mezcla de Bayas", active: true },
  { id: "f10", key: "peach", label_en: "Peach", label_es: "Durazno", active: false },
  { id: "f11", key: "tangerine_natural", label_en: "Tangerine (All Natural)", label_es: "Mandarina (Natural)", active: true },
  { id: "f12", key: "mango_natural", label_en: "Mango (All Natural)", label_es: "Mango (Natural)", active: true },
];

export default function AdminPage() {
  const { locale } = useLocale();
  const isEn = locale === "en";
  const [tab, setTab] = useState<Tab>("dashboard");

  const [assessments, setAssessments] = useState<AssessmentRow[]>([]);
  const [flavors, setFlavors] = useState<FlavorRow[]>([]);
  const [counts, setCounts] = useState({ assessments: 0, mixes: 0, orders: 0 });
  const [search, setSearch] = useState("");
  const [isDemoMode, setIsDemoMode] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    let active = true;
    async function load() {
      try {
        const [a, mixCount, orderCount, assessCount, fl] = await Promise.all([
          supabase.from("assessments").select("id, name, email, created_at, answers").order("created_at", { ascending: false }).limit(50),
          supabase.from("custom_mixes").select("id", { count: "exact", head: true }),
          supabase.from("orders").select("id", { count: "exact", head: true }),
          supabase.from("assessments").select("id", { count: "exact", head: true }),
          supabase.from("flavors").select("id, key, label_en, label_es, active").order("sort_order", { ascending: true }),
        ]);
        if (!active) return;
        const assessData = a.data ?? [];
        const flavorData = fl.data ?? [];
        const usingDemo = assessData.length === 0;
        setIsDemoMode(usingDemo);
        setAssessments(usingDemo ? DEMO_ASSESSMENTS : assessData);
        setFlavors(flavorData.length > 0 ? flavorData : DEMO_FLAVORS);
        setCounts({
          assessments: (assessCount.count ?? 0) || 47,
          mixes: (mixCount.count ?? 0) || 38,
          orders: (orderCount.count ?? 0) || 21,
        });
      } catch {
        // Supabase not configured — leave demo defaults.
      }
    }
    load();
    return () => { active = false; };
  }, []);

  const mostCommonSport = useMemo(() => {
    const tally: Record<string, number> = {};
    for (const row of assessments) {
      const s = (row.answers as { sportType?: string } | null)?.sportType;
      if (s) tally[s] = (tally[s] ?? 0) + 1;
    }
    const sorted = Object.entries(tally).sort((a, b) => b[1] - a[1]);
    return sorted[0]?.[0] ?? "—";
  }, [assessments]);

  const sportChart = useMemo(() => {
    const tally: Record<string, number> = {};
    for (const row of assessments) {
      const s = (row.answers as { sportType?: string } | null)?.sportType ?? "other";
      tally[s] = (tally[s] ?? 0) + 1;
    }
    return Object.entries(tally).map(([sport, count]) => ({ sport, count }));
  }, [assessments]);

  const filtered = assessments.filter(
    (a) =>
      a.name?.toLowerCase().includes(search.toLowerCase()) ||
      a.email?.toLowerCase().includes(search.toLowerCase())
  );

  async function toggleFlavor(f: FlavorRow) {
    const supabase = createClient();
    const next = !f.active;
    setFlavors((prev) => prev.map((x) => (x.id === f.id ? { ...x, active: next } : x)));
    try {
      await supabase.from("flavors").update({ active: next }).eq("id", f.id);
    } catch { /* ignore */ }
  }

  const tabs: { key: Tab; en: string; es: string }[] = [
    { key: "dashboard", en: "Dashboard", es: "Panel" },
    { key: "athletes", en: "Athletes", es: "Atletas" },
    { key: "config", en: "Product Config", es: "Configuración" },
  ];

  const kpis = [
    { label: isEn ? "Total Assessments" : "Evaluaciones", value: counts.assessments },
    { label: isEn ? "Total Custom Mixes" : "Mezclas Personalizadas", value: counts.mixes },
    { label: isEn ? "Total Orders" : "Órdenes", value: counts.orders },
    { label: isEn ? "Most Common Sport" : "Deporte Más Común", value: mostCommonSport },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <SiteHeader />
      <main className="flex-1 px-6 pt-28 pb-24">
        <div className="mx-auto max-w-5xl">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-semibold tracking-tight text-ink">{isEn ? "Admin Portal" : "Portal de Administración"}</h1>
            {isDemoMode && (
              <span className="rounded-full border border-line px-3 py-1 text-xs uppercase tracking-widest text-ink-3">
                {isEn ? "Demo Mode" : "Modo Demo"}
              </span>
            )}
          </div>

          <div className="mt-8 flex gap-2 border-b border-line">
            {tabs.map((tb) => (
              <button key={tb.key} onClick={() => setTab(tb.key)}
                className={`-mb-px border-b-2 px-4 py-2 text-sm transition-colors ${
                  tab === tb.key ? "border-ink text-ink" : "border-transparent text-ink-3 hover:text-ink-2"
                }`}>
                {isEn ? tb.en : tb.es}
              </button>
            ))}
          </div>

          {tab === "dashboard" && (
            <div className="mt-8">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {kpis.map((k) => (
                  <Card key={k.label} className="text-center">
                    <p className="text-xs uppercase tracking-widest text-ink-3">{k.label}</p>
                    <p className="mt-3 text-2xl font-semibold capitalize text-ink">{k.value}</p>
                  </Card>
                ))}
              </div>

              <div className="mt-8 grid gap-5 lg:grid-cols-2">
                <Card>
                  <CardTitle>{isEn ? "Signups Trend" : "Tendencia de Registros"}</CardTitle>
                  <div className="mt-4 h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={signupTrend} margin={{ top: 8, right: 8, bottom: 8, left: -16 }}>
                        <CartesianGrid stroke="var(--line)" vertical={false} />
                        <XAxis dataKey="month" stroke="var(--ink-3)" fontSize={11} tickLine={false} />
                        <YAxis stroke="var(--ink-3)" fontSize={11} tickLine={false} axisLine={false} />
                        <Tooltip contentStyle={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 8, color: "var(--ink)" }} />
                        <Line type="monotone" dataKey="count" stroke="var(--accent-1)" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                <Card>
                  <CardTitle>{isEn ? "Assessments by Sport" : "Evaluaciones por Deporte"}</CardTitle>
                  <div className="mt-4 h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={sportChart} margin={{ top: 8, right: 8, bottom: 8, left: -16 }}>
                        <CartesianGrid stroke="var(--line)" vertical={false} />
                        <XAxis dataKey="sport" stroke="var(--ink-3)" fontSize={11} tickLine={false} />
                        <YAxis stroke="var(--ink-3)" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                        <Tooltip cursor={{ fill: "var(--surface-2)" }} contentStyle={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 8, color: "var(--ink)" }} />
                        <Bar dataKey="count" fill="var(--accent-2)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {tab === "athletes" && (
            <div className="mt-8">
              <input value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder={isEn ? "Search by name or email…" : "Buscar por nombre o correo…"}
                className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink placeholder:text-ink-3 focus:border-ink focus:outline-none" />
              <div className="mt-6 overflow-x-auto rounded-2xl border border-line">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-line text-xs uppercase tracking-widest text-ink-3">
                    <tr>
                      <th className="px-4 py-3">{isEn ? "Name" : "Nombre"}</th>
                      <th className="px-4 py-3">{isEn ? "Email" : "Correo"}</th>
                      <th className="px-4 py-3">{isEn ? "Sport" : "Deporte"}</th>
                      <th className="px-4 py-3">{isEn ? "Event" : "Evento"}</th>
                      <th className="px-4 py-3">{isEn ? "Date" : "Fecha"}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((a) => {
                      const ans = a.answers as { sportType?: string; eventName?: string } | null;
                      return (
                        <tr key={a.id} className="border-b border-line last:border-0">
                          <td className="px-4 py-3 text-ink">{a.name}</td>
                          <td className="px-4 py-3 text-ink-2">{a.email}</td>
                          <td className="px-4 py-3 capitalize text-ink-2">{ans?.sportType ?? "—"}</td>
                          <td className="px-4 py-3 text-ink-2">{ans?.eventName || "—"}</td>
                          <td className="px-4 py-3 text-ink-3">{new Date(a.created_at).toLocaleDateString()}</td>
                        </tr>
                      );
                    })}
                    {filtered.length === 0 && (
                      <tr><td colSpan={5} className="px-4 py-8 text-center text-ink-3">{isEn ? "No athletes found." : "No se encontraron atletas."}</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === "config" && (
            <div className="mt-8">
              <CardTitle>{isEn ? "Flavor Catalog" : "Catálogo de Sabores"}</CardTitle>
              <p className="mt-1 text-sm text-ink-3">{isEn ? "Toggle flavors active or inactive." : "Activa o desactiva sabores."}</p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {flavors.map((f) => (
                  <div key={f.id} className="flex items-center justify-between rounded-xl border border-line bg-surface px-4 py-3">
                    <span className="text-sm text-ink">{isEn ? f.label_en : f.label_es}</span>
                    <button onClick={() => toggleFlavor(f)}
                      className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                        f.active ? "border-ink bg-ink text-bg" : "border-line text-ink-3"
                      }`}>
                      {f.active ? (isEn ? "Active" : "Activo") : (isEn ? "Inactive" : "Inactivo")}
                    </button>
                  </div>
                ))}
                {flavors.length === 0 && (
                  <p className="text-sm text-ink-3">{isEn ? "Connect Supabase to manage flavors." : "Conecta Supabase para administrar sabores."}</p>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
