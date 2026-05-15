"use client";

import { useEffect, useState } from "react";
import { BarChart3 } from "lucide-react";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";

export default function ReportsPage() {
  const [tab, setTab] = useState("overview");
  const [raw, setRaw] = useState<unknown>(null);

  useEffect(() => {
    void fetch(`/api/reports?type=${tab}`, { credentials: "include" })
      .then((r) => r.json())
      .then((j) => setRaw(j.data));
  }, [tab]);

  const tabs = [
    { id: "overview", label: "Vue d’ensemble" },
    { id: "financial", label: "Financier" },
    { id: "clients", label: "Clients" },
    { id: "operational", label: "Opérationnel" },
  ];

  return (
    <>
      <PageBreadCrumb titleKey="titles.reports" />
      <div className="space-y-6">
        <ComponentCard
          title={
            <span className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-brand-500" aria-hidden />
              Type de rapport
            </span>
          }
          desc="Charge les agrégats via l’API selon la catégorie choisie."
        >
          <div className="flex flex-wrap gap-2">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`rounded-lg px-4 py-2 text-theme-sm font-medium transition-colors ${
                  tab === t.id
                    ? "bg-brand-500 text-white shadow-theme-xs"
                    : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-white/[0.03] dark:text-gray-300 dark:hover:bg-white/5"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </ComponentCard>

        <ComponentCard title="Réponse JSON" desc="Payload brut pour vérif ou debug.">
          <div className="overflow-hidden rounded-xl border border-gray-100 bg-gray-50 dark:border-gray-800 dark:bg-gray-900/80">
            <pre className="max-h-[28rem] overflow-auto p-4 text-theme-xs text-gray-800 dark:text-gray-300">
              {JSON.stringify(raw, null, 2)}
            </pre>
          </div>
        </ComponentCard>
      </div>
    </>
  );
}
