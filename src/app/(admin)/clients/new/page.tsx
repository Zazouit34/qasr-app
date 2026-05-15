"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Save, UserPlus } from "lucide-react";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import { toast } from "sonner";

const fieldClass =
  "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-white/[0.03] dark:text-white dark:placeholder:text-gray-500";

export default function NewClientPage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");

  async function submit() {
    const res = await fetch("/api/clients", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ firstName, lastName, phone }),
    });
    const j = await res.json();
    if (!j.success) {
      toast.error(j.error);
      return;
    }
    toast.success("Client créé");
    router.push(`/clients/${j.data.id}`);
  }

  return (
    <>
      <PageBreadCrumb titleKey="titles.clientNew" />
      <ComponentCard
        title={
          <span className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-brand-500" aria-hidden />
            Créer un client
          </span>
        }
        desc="Ajoutez une fiche avec prénom, nom et téléphone."
      >
        <div className="max-w-lg space-y-4">
          <div>
            <label className="mb-1 block text-theme-xs font-medium text-gray-700 dark:text-gray-300">Prénom</label>
            <input
              className={fieldClass}
              placeholder="Prénom"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-theme-xs font-medium text-gray-700 dark:text-gray-300">Nom</label>
            <input
              className={fieldClass}
              placeholder="Nom"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-theme-xs font-medium text-gray-700 dark:text-gray-300">Téléphone</label>
            <input
              className={fieldClass}
              placeholder="Téléphone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600"
            onClick={() => void submit()}
          >
            <Save className="h-4 w-4" aria-hidden />
            Enregistrer
          </button>
        </div>
      </ComponentCard>
    </>
  );
}
