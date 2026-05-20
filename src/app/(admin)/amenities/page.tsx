"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import { amenityIconFor } from "@/lib/lucide-entity-icons";
import type { Amenity } from "@prisma/client";

export default function AmenitiesPage() {
  const [items, setItems] = useState<Amenity[]>([]);

  useEffect(() => {
    void fetch("/api/amenities", { credentials: "include" })
      .then((r) => r.json())
      .then((j) => setItems(j.data ?? []));
  }, []);

  return (
    <>
      <PageBreadCrumb titleKey="titles.amenities" />
      <ComponentCard
        title={
          <span className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-brand-500" aria-hidden />
            Liste des équipements
          </span>
        }
        desc="Icônes indicative selon le libellé (Wi‑Fi, parking, restauration, etc.)."
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.length === 0 ? (
            <p className="col-span-full text-center text-theme-sm text-gray-500 dark:text-gray-400">
              Aucune aménité.
            </p>
          ) : (
            items.map((a) => {
              const Icon = amenityIconFor(a.name);
              return (
                <div
                  key={a.id}
                  className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 p-4 text-theme-sm dark:border-white/[0.06] dark:bg-white/[0.02]"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-brand-500 shadow-theme-xs dark:bg-white/[0.05]">
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <span className="font-medium text-gray-800 dark:text-white/90">{a.name}</span>
                </div>
              );
            })
          )}
        </div>
      </ComponentCard>
    </>
  );
}
