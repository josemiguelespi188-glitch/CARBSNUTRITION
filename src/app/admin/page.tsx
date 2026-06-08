"use client";

import { useLocale } from "@/lib/i18n/context";
import { SiteHeader } from "@/components/SiteHeader";
import { Card, CardBody, CardTitle } from "@/components/ui/card";

const metrics = [
  { key: "total_users", en: "Total Users", es: "Usuarios Totales" },
  { key: "total_assessments", en: "Total Assessments", es: "Evaluaciones Totales" },
  { key: "conversion_rate", en: "Conversion Rate", es: "Tasa de Conversión" },
  { key: "orders", en: "Orders", es: "Órdenes" },
  { key: "revenue", en: "Revenue", es: "Ingresos" },
  { key: "top_flavor", en: "Most Selected Flavor", es: "Sabor Más Elegido" },
  { key: "top_carbs", en: "Most Selected Carb Level", es: "Nivel de Carbs Más Elegido" },
  { key: "top_sodium", en: "Most Selected Sodium Level", es: "Nivel de Sodio Más Elegido" },
];

export default function AdminPage() {
  const { locale } = useLocale();
  const isEn = locale === "en";

  return (
    <div className="flex min-h-screen flex-col bg-black">
      <SiteHeader />
      <main className="flex-1 px-6 pt-28 pb-24">
        <div className="mx-auto max-w-5xl">
          <h1 className="text-3xl font-semibold tracking-tight">{isEn ? "Admin Portal" : "Portal de Administración"}</h1>
          <p className="mt-2 text-neutral-400">
            {isEn
              ? "Restricted to admin_users. Connect Supabase to populate live metrics, customer profiles, and product configuration."
              : "Restringido a admin_users. Conecta Supabase para alimentar métricas en vivo, perfiles de clientes y configuración de productos."}
          </p>

          <h2 className="mt-10 text-sm uppercase tracking-widest text-neutral-500">{isEn ? "Key Metrics" : "Métricas Clave"}</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {metrics.map((m) => (
              <Card key={m.key} className="text-center">
                <p className="text-xs uppercase tracking-widest text-neutral-500">{isEn ? m.en : m.es}</p>
                <p className="mt-3 text-2xl font-semibold text-white">—</p>
              </Card>
            ))}
          </div>

          <div className="mt-10 grid gap-5 sm:grid-cols-3">
            <Card>
              <CardTitle>{isEn ? "Customer Profiles" : "Perfiles de Clientes"}</CardTitle>
              <CardBody>{isEn ? "Search athletes, view assessment responses, recommendations, and order history." : "Busca atletas, consulta respuestas de evaluación, recomendaciones e historial de órdenes."}</CardBody>
            </Card>
            <Card>
              <CardTitle>{isEn ? "Product Configuration" : "Configuración de Producto"}</CardTitle>
              <CardBody>{isEn ? "Manage flavors, sodium options, caffeine options, and carb levels available in the formula engine." : "Administra sabores, opciones de sodio, opciones de cafeína y niveles de carbohidratos disponibles en el motor de fórmulas."}</CardBody>
            </Card>
            <Card>
              <CardTitle>{isEn ? "Survey Analytics" : "Analítica de Encuestas"}</CardTitle>
              <CardBody>{isEn ? "Track post-purchase feedback scores and formula performance trends over time." : "Da seguimiento a las puntuaciones de retroalimentación post-compra y tendencias de desempeño de las fórmulas."}</CardBody>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
