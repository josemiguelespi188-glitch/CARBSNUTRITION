"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { useLocale } from "@/lib/i18n/context";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";

interface MixRow {
  id: string;
  package_label: string;
  flavor: string | null;
  carbs_per_serving: number | null;
  sodium_per_serving: number | null;
  caffeine_per_serving: number | null;
  created_at: string;
}

interface EventRow {
  id: string;
  event_name: string | null;
  event_date: string | null;
  sport_type: string | null;
  training_hours_per_week: number | null;
}

export default function DashboardPage() {
  const { locale } = useLocale();
  const router = useRouter();
  const isEn = locale === "en";

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [mixes, setMixes] = useState<MixRow[]>([]);
  const [events, setEvents] = useState<EventRow[]>([]);

  useEffect(() => {
    const supabase = createClient();
    let active = true;

    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!active) return;
      setUser(user);
      if (user) {
        const { data: m } = await supabase
          .from("custom_mixes")
          .select("id, package_label, flavor, carbs_per_serving, sodium_per_serving, caffeine_per_serving, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(20);
        const { data: e } = await supabase
          .from("event_profiles")
          .select("id, event_name, event_date, sport_type, training_hours_per_week")
          .eq("user_id", user.id)
          .order("event_date", { ascending: true });
        if (!active) return;
        setMixes(m ?? []);
        setEvents(e ?? []);
      }
      setLoading(false);
    }
    load();
    return () => { active = false; };
  }, []);

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.refresh();
    setUser(null);
  }

  const nextEvent = events.find((e) => e.event_date);
  const daysToEvent = nextEvent?.event_date
    ? Math.max(0, Math.ceil((new Date(nextEvent.event_date).getTime() - Date.now()) / (24 * 60 * 60 * 1000)))
    : null;

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-black">
        <SiteHeader />
        <main className="flex flex-1 items-center justify-center px-6 pt-28 pb-24 text-neutral-500">
          {isEn ? "Loading…" : "Cargando…"}
        </main>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col bg-black">
        <SiteHeader />
        <main className="flex flex-1 flex-col items-center justify-center px-6 pt-28 pb-24 text-center">
          <h1 className="text-3xl font-semibold tracking-tight">{isEn ? "Your Dashboard" : "Tu Panel"}</h1>
          <p className="mt-3 max-w-md text-neutral-400">
            {isEn
              ? "Sign in to view your formulas, events, and scoop usage."
              : "Inicia sesión para ver tus fórmulas, eventos y uso de cucharadas."}
          </p>
          <Link href="/auth" className="mt-8">
            <Button size="lg">{isEn ? "Sign In / Sign Up" : "Iniciar Sesión / Registrarse"}</Button>
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-black">
      <SiteHeader />
      <main className="flex-1 px-6 pt-28 pb-24">
        <div className="mx-auto max-w-4xl">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-semibold tracking-tight">{isEn ? "Athlete Dashboard" : "Panel del Atleta"}</h1>
            <Button variant="ghost" size="sm" onClick={signOut}>{isEn ? "Sign Out" : "Cerrar Sesión"}</Button>
          </div>
          <p className="mt-2 text-sm text-neutral-500">{user.email}</p>

          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            <Card>
              <CardTitle>{isEn ? "My Profile" : "Mi Perfil"}</CardTitle>
              <CardBody>
                {nextEvent ? (
                  <span>
                    {nextEvent.sport_type ?? "—"} · {nextEvent.event_name ?? (isEn ? "No event" : "Sin evento")}
                    {nextEvent.training_hours_per_week ? ` · ${nextEvent.training_hours_per_week}h/${isEn ? "wk" : "sem"}` : ""}
                  </span>
                ) : (
                  isEn ? "Complete an assessment to build your profile." : "Completa una evaluación para crear tu perfil."
                )}
              </CardBody>
            </Card>

            <Card>
              <CardTitle>{isEn ? "Race Countdown" : "Cuenta Regresiva"}</CardTitle>
              <CardBody>
                {daysToEvent !== null
                  ? <span className="text-2xl font-semibold text-white">{daysToEvent} {isEn ? "days" : "días"}</span>
                  : (isEn ? "No upcoming event scheduled." : "No hay eventos próximos.")}
              </CardBody>
            </Card>
          </div>

          <h2 className="mt-10 text-sm uppercase tracking-widest text-neutral-500">{isEn ? "My Formulas" : "Mis Fórmulas"}</h2>
          <div className="mt-4 space-y-3">
            {mixes.length === 0 && (
              <p className="text-sm text-neutral-500">{isEn ? "No saved formulas yet." : "Aún no tienes fórmulas guardadas."}</p>
            )}
            {mixes.map((m) => (
              <Card key={m.id}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="font-medium text-white">{m.package_label}</p>
                  <p className="text-xs text-neutral-400">
                    {m.carbs_per_serving ?? "—"}g · {m.sodium_per_serving ?? "—"}mg Na · {m.caffeine_per_serving ?? "—"}mg caf
                    {m.flavor ? ` · ${m.flavor.replace(/_/g, " ")}` : ""}
                  </p>
                </div>
              </Card>
            ))}
          </div>

          <h2 className="mt-10 text-sm uppercase tracking-widest text-neutral-500">{isEn ? "Upcoming Events" : "Próximos Eventos"}</h2>
          <div className="mt-4 space-y-3">
            {events.length === 0 && (
              <p className="text-sm text-neutral-500">{isEn ? "No events yet." : "Aún no hay eventos."}</p>
            )}
            {events.map((e) => (
              <Card key={e.id}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="font-medium text-white">{e.event_name ?? "—"}</p>
                  <p className="text-xs text-neutral-400">{e.event_date ?? "—"} · {e.sport_type ?? "—"}</p>
                </div>
              </Card>
            ))}
          </div>

          <div className="mt-10">
            <Link href="/assessment">
              <Button>{isEn ? "Build a New Formula" : "Crea una Nueva Fórmula"}</Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
