"use client";

import { useEffect, useState } from "react";
import { Check, Package } from "lucide-react";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import { formatDZD } from "@/lib/utils";

type P = {
  id: string;
  name: string;
  basePrice: number;
  items: { label: string }[];
};

export default function PackagesPage() {
  const [items, setItems] = useState<P[]>([]);

  useEffect(() => {
    void fetch("/api/packages", { credentials: "include" })
      .then((r) => r.json())
      .then((j) => setItems(j.data ?? []));
  }, []);

  return (
    <>
      <PageBreadCrumb titleKey="titles.packages" />
      <ComponentCard
        title={
          <span className="flex items-center gap-2">
            <Package className="h-5 w-5 text-brand-500" aria-hidden />
            Catalogue
          </span>
        }
        desc="Forfaits proposés avec prix de base et prestations incluses."
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.length === 0 ? (
            <p className="col-span-full text-center text-theme-sm text-gray-500 dark:text-gray-400">
              Aucun forfait configuré.
            </p>
          ) : (
            items.map((p) => (
              <div
                key={p.id}
                className="flex flex-col rounded-xl border border-gray-100 bg-gray-50 p-5 dark:border-white/[0.06] dark:bg-white/[0.02]"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white shadow-theme-xs dark:bg-white/[0.05]">
                    <Package className="h-5 w-5 text-brand-500" aria-hidden />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 dark:text-white/90">{p.name}</h3>
                    <p className="mt-1 text-lg font-medium text-brand-600 dark:text-brand-400">{formatDZD(p.basePrice)}</p>
                  </div>
                </div>
                <ul className="mt-4 space-y-2 border-t border-gray-200 pt-4 text-theme-sm dark:border-gray-700">
                  {p.items.map((i) => (
                    <li key={i.label} className="flex items-start gap-2 text-gray-600 dark:text-gray-400">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-success-500" aria-hidden />
                      {i.label}
                    </li>
                  ))}
                </ul>
              </div>
            ))
          )}
        </div>
      </ComponentCard>
    </>
  );
}
