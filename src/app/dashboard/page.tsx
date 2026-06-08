"use client";

import Link from "next/link";
import { useLocale } from "@/lib/i18n/context";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardTitle } from "@/components/ui/card";

export default function DashboardPage() {
  const { locale } = useLocale();
  const isEn = locale === "en";

  return (
    <div className="flex min-h-screen flex-col bg-black">
      <SiteHeader />
      <main className="flex-1 px-6 pt-28 pb-24">
        <div className="mx-auto max-w-4xl">
          <h1 className="text-3xl font-semibold tracking-tight">{isEn ? "Athlete Dashboard" : "Panel del Atleta"}</h1>
          <p className="mt-2 text-neutral-400">
            {isEn
              ? "Sign in to view your formulas, reorder, and update your profile. Below is a preview of what your dashboard will include."
              : "Inicia sesión para ver tus fórmulas, reordenar y actualizar tu perfil. Esta es una vista previa de lo que incluirá tu panel."}
          </p>

          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            <Card>
              <CardTitle>{isEn ? "Your Profile" : "Tu Perfil"}</CardTitle>
              <CardBody>{isEn ? "Sport, goals, physiology, and tolerances — kept up to date as you evolve." : "Deporte, objetivos, fisiología y tolerancias — siempre actualizados conforme evolucionas."}</CardBody>
            </Card>
            <Card>
              <CardTitle>{isEn ? "Your Formulas" : "Tus Fórmulas"}</CardTitle>
              <CardBody>{isEn ? "View every personalized mix you've built, with full reasoning and history." : "Consulta cada mezcla personalizada que has creado, con su razonamiento completo e historial."}</CardBody>
            </Card>
            <Card>
              <CardTitle>{isEn ? "Reorder in One Click" : "Reordena con Un Clic"}</CardTitle>
              <CardBody>{isEn ? "Repeat your favorite formula or build a new one for your next training block." : "Repite tu fórmula favorita o crea una nueva para tu próximo bloque de entrenamiento."}</CardBody>
            </Card>
            <Card>
              <CardTitle>{isEn ? "Performance Feedback" : "Retroalimentación de Rendimiento"}</CardTitle>
              <CardBody>{isEn ? "Tell us how your formula performed so future recommendations get sharper." : "Cuéntanos cómo te funcionó tu fórmula para que las próximas recomendaciones sean aún más precisas."}</CardBody>
            </Card>
          </div>

          <div className="mt-10 flex flex-col items-start gap-3">
            <Link href="/assessment">
              <Button>{isEn ? "Build Your First Formula" : "Crea tu Primera Fórmula"}</Button>
            </Link>
            <p className="text-xs text-neutral-600">
              {isEn ? "Authentication via Supabase Auth — connect your account to unlock the full dashboard." : "Autenticación mediante Supabase Auth — conecta tu cuenta para desbloquear el panel completo."}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
