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

export default function AdminPage() {
  const { locale } = useLocale();
  const isEn = locale === "en";
  const [tab, setTab] = useState<Tab>("dashboard");

  const [assessments, setAssessments] = useState<AssessmentRow[]>([]);
  const [flavors, setFlavors] = useState<FlavorRow[]>([]);
  const [counts, setCounts] = useState({ assessments: 0, mixes: 0, orders: 0 });
  const [search, setSearch] = useState("");

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
        setAssessments(a.data ?? []);
        setFlavors(fl.data ?? []);
        setCounts({
          assessments: assessCount.count ?? 0,
          mixes: mixCount.count ?? 0,
          orders: orderCount.count ?? 0,
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
    } catch {
      // ignore
    }
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
    <div className="flex min-h-screen flex-col bg-black">
      <SiteHeader />
      <main className="flex-1 px-6 pt-28 pb-24">
        <div className="mx-auto max-w-5xl">
          <h1 className="text-3xl font-semibold tracking-tight">{isEn ? "Admin Portal" : "Portal de Administración"}</h1>

          <div className="mt-8 flex gap-2 border-b border-neutral-900">
            {tabs.map((tb) => (
              <button
                key={tb.key}
                onClick={() => setTab(tb.key)}
                className={`-mb-px border-b-2 px-4 py-2 text-sm transition-colors ${
                  tab === tb.key ? "border-white text-white" : "border-transparent text-neutral-500 hover:text-neutral-300"
                }`}
              >
                {isEn ? tb.en : tb.es}
              </button>
            ))}
          </div>

          {tab === "dashboard" && (
            <div className="mt-8">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {kpis.map((k) => (
                  <Card key={k.label} className="text-center">
                    <p className="text-xs uppercase tracking-widest text-neutral-500">{k.label}</p>
                    <p className="mt-3 text-2xl font-semibold capitalize text-white">{k.value}</p>
                  </Card>
                ))}
              </div>

              <div className="mt-8 grid gap-5 lg:grid-cols-2">
                <Card>
                  <CardTitle>{isEn ? "Signups Trend" : "Tendencia de Registros"}</CardTitle>
                  <div className="mt-4 h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={signupTrend} margin={{ top: 8, right: 8, bottom: 8, left: -16 }}>
                        <CartesianGrid stroke="#262626" vertical={false} />
                        <XAxis dataKey="month" stroke="#737373" fontSize={11} tickLine={false} />
                        <YAxis stroke="#737373" fontSize={11} tickLine={false} axisLine={false} />
                        <Tooltip contentStyle={{ background: "#0a0a0a", border: "1px solid #404040", borderRadius: 8, color: "#fff" }} />
                        <Line type="monotone" dataKey="count" stroke="#ffffff" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                <Card>
                  <CardTitle>{isEn ? "Assessments by Sport" : "Evaluaciones por Deporte"}</CardTitle>
                  <div className="mt-4 h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={sportChart} margin={{ top: 8, right: 8, bottom: 8, left: -16 }}>
                        <CartesianGrid stroke="#262626" vertical={false} />
                        <XAxis dataKey="sport" stroke="#737373" fontSize={11} tickLine={false} />
                        <YAxis stroke="#737373" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                        <Tooltip cursor={{ fill: "#171717" }} contentStyle={{ background: "#0a0a0a", border: "1px solid #404040", borderRadius: 8, color: "#fff" }} />
                        <Bar dataKey="count" fill="#ffffff" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {tab === "athletes" && (
            <div className="mt-8">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={isEn ? "Search by name or email…" : "Buscar por nombre o correo…"}
                className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 text-sm text-white placeholder:text-neutral-600 focus:border-white focus:outline-none"
              />
              <div className="mt-6 overflow-x-auto rounded-2xl border border-neutral-900">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-neutral-900 text-xs uppercase tracking-widest text-neutral-500">
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
                        <tr key={a.id} className="border-b border-neutral-900 last:border-0">
                          <td className="px-4 py-3 text-white">{a.name}</td>
                          <td className="px-4 py-3 text-neutral-400">{a.email}</td>
                          <td className="px-4 py-3 capitalize text-neutral-400">{ans?.sportType ?? "—"}</td>
                          <td className="px-4 py-3 text-neutral-400">{ans?.eventName || "—"}</td>
                          <td className="px-4 py-3 text-neutral-500">{new Date(a.created_at).toLocaleDateString()}</td>
                        </tr>
                      );
                    })}
                    {filtered.length === 0 && (
                      <tr><td colSpan={5} className="px-4 py-8 text-center text-neutral-600">{isEn ? "No athletes found." : "No se encontraron atletas."}</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === "config" && (
            <div className="mt-8">
              <CardTitle>{isEn ? "Flavor Catalog" : "Catálogo de Sabores"}</CardTitle>
              <p className="mt-1 text-sm text-neutral-500">{isEn ? "Toggle flavors active or inactive." : "Activa o desactiva sabores."}</p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {flavors.map((f) => (
                  <div key={f.id} className="flex items-center justify-between rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-3">
                    <span className="text-sm text-white">{isEn ? f.label_en : f.label_es}</span>
                    <button
                      onClick={() => toggleFlavor(f)}
                      className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                        f.active ? "border-white bg-white text-black" : "border-neutral-700 text-neutral-400"
                      }`}
                    >
                      {f.active ? (isEn ? "Active" : "Activo") : (isEn ? "Inactive" : "Inactivo")}
                    </button>
                  </div>
                ))}
                {flavors.length === 0 && (
                  <p className="text-sm text-neutral-600">{isEn ? "Connect Supabase to manage flavors." : "Conecta Supabase para administrar sabores."}</p>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
