"use client";

import { Settings2 } from "lucide-react";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";

export default function SettingsPage() {
  return (
    <>
      <PageBreadCrumb titleKey="titles.settings" />
      <ComponentCard
        title={
          <span className="flex items-center gap-2">
            <Settings2 className="h-5 w-5 text-brand-500" aria-hidden />
            À venir
          </span>
        }
        desc="Profil du lieu, préférences, utilisateurs et export CSV — reliez vos formulaires aux routes /api correspondantes lorsque ces écrans seront disponibles."
      >
        <p className="text-theme-sm leading-relaxed text-gray-600 dark:text-gray-400">
          Cette page sert de point d’entrée pour la configuration SaaS : équipe du lieu, rôles, modèles d’email, et intégrations.
        </p>
      </ComponentCard>
    </>
  );
}
