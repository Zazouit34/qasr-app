"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import { useRouter } from "next/navigation";
import type { Client, EventType, Hall } from "@prisma/client";
import { toast } from "sonner";
import ComponentCard from "@/components/common/ComponentCard";
import { CalendarPlus } from "lucide-react";

function NewEventInner() {
  const router = useRouter();
  const sp = useSearchParams();
  const presetDate = sp.get("date") ?? "";
  const [step, setStep] = useState(1);
  const [clients, setClients] = useState<Client[]>([]);
  const [halls, setHalls] = useState<Hall[]>([]);

  const [clientId, setClientId] = useState("");
  const [type, setType] = useState<EventType>("WEDDING");
  const [title, setTitle] = useState("");
  const [eventDate, setEventDate] = useState(presetDate);
  const [hallId, setHallId] = useState<string>("");
  const [startTime, setStartTime] = useState("18:00");
  const [endTime, setEndTime] = useState("02:00");
  const [guestCount, setGuestCount] = useState(150);
  const [basePrice, setBasePrice] = useState(500_000);
  const [totalPrice, setTotalPrice] = useState(800_000);

  useEffect(() => {
    void fetch("/api/clients?limit=200", { credentials: "include" })
      .then((r) => r.json())
      .then((j) => setClients(j.data?.items ?? []));
    void fetch("/api/halls", { credentials: "include" })
      .then((r) => r.json())
      .then((j) => setHalls(j.data ?? []));
  }, []);

  useEffect(() => {
    if (halls.length > 0 && !hallId) {
      setHallId(halls[0].id);
    }
  }, [halls, hallId]);

  async function submit() {
    if (!clientId || !eventDate || !hallId) {
      toast.error("Client, date et salle requis.");
      return;
    }
    const res = await fetch("/api/events", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientId,
        hallId,
        type,
        title: title || "Nouvel événement",
        eventDate,
        startTime,
        endTime,
        guestCount,
        basePrice,
        totalPrice,
        serviceLines: [],
        amenityIds: [],
      }),
    });
    const j = await res.json();
    if (!j.success) {
      toast.error(j.error ?? "Erreur");
      return;
    }
    toast.success("Événement créé");
    router.push(`/events/${j.data.id}`);
  }

  return (
    <>
      <PageBreadCrumb titleKey="titles.eventsNew" />
      <ComponentCard
        title={
          <span className="flex items-center gap-2">
            <CalendarPlus className="h-5 w-5 text-brand-500" aria-hidden />
            Configuration
          </span>
        }
        desc="Parcours en trois étapes : client et type, date et salle, montants."
      >
        <div className="mx-auto max-w-3xl space-y-6">
          <div className="mb-2 flex gap-2 text-sm">
          {[1, 2, 3].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStep(s)}
              className={`rounded-lg px-3 py-1 ${
                step === s
                  ? "bg-brand-500 text-white"
                  : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
              }`}
            >
              Étape {s}
            </button>
          ))}
        </div>
        {step === 1 && (
          <div className="grid gap-4">
            <label className="block text-sm">
              <span className="mb-1 block text-gray-600">Client</span>
              <select
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-theme-xs dark:border-gray-700 dark:bg-white/[0.03] dark:text-white"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
              >
                <option value="">— Sélectionner —</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.firstName} {c.lastName} · {c.phone}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              Type
              <select
                className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-theme-xs dark:border-gray-700 dark:bg-white/[0.03] dark:text-white"
                value={type}
                onChange={(e) => setType(e.target.value as EventType)}
              >
                <option value="WEDDING">Mariage</option>
                <option value="ENGAGEMENT">Fiançailles</option>
                <option value="BIRTHDAY">Anniversaire</option>
                <option value="OTHER">Autre</option>
              </select>
            </label>
            <label className="block text-sm">
              Titre
              <input
                className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-theme-xs dark:border-gray-700 dark:bg-white/[0.03] dark:text-white"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </label>
          </div>
        )}
        {step === 2 && (
          <div className="grid gap-4">
            <label className="block text-sm">
              Date de l’événement
              <input
                type="date"
                className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-theme-xs dark:border-gray-700 dark:bg-white/[0.03] dark:text-white"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
              />
            </label>
            <label className="block text-sm">
              Salle
              {halls.length === 0 ? (
                <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-theme-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-500/10 dark:text-amber-100">
                  <p>Aucune salle enregistrée pour ce lieu.</p>
                  <Link href="/onboarding" className="mt-1 inline-block font-medium text-brand-700 underline dark:text-brand-300">
                    Configurer les salles
                  </Link>
                </div>
              ) : null}
              <select
                className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-theme-xs dark:border-gray-700 dark:bg-white/[0.03] dark:text-white"
                value={hallId}
                onChange={(e) => setHallId(e.target.value)}
              >
                <option value="">— Choisir une salle —</option>
                {halls.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name} ({h.capacity} pers.)
                  </option>
                ))}
              </select>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="text-sm">
                Début
                <input
                  className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-theme-xs dark:border-gray-700 dark:bg-white/[0.03] dark:text-white"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </label>
              <label className="text-sm">
                Fin
                <input
                  className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-theme-xs dark:border-gray-700 dark:bg-white/[0.03] dark:text-white"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </label>
            </div>
            <label className="block text-sm">
              Invités
              <input
                type="number"
                className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-theme-xs dark:border-gray-700 dark:bg-white/[0.03] dark:text-white"
                value={guestCount}
                onChange={(e) => setGuestCount(Number(e.target.value))}
              />
            </label>
          </div>
        )}
        {step === 3 && (
          <div className="grid gap-4">
            <label className="block text-sm">
              Prix de base (DZD)
              <input
                type="number"
                className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-theme-xs dark:border-gray-700 dark:bg-white/[0.03] dark:text-white"
                value={basePrice}
                onChange={(e) => setBasePrice(Number(e.target.value))}
              />
            </label>
            <label className="block text-sm">
              Total (DZD)
              <input
                type="number"
                className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-theme-xs dark:border-gray-700 dark:bg-white/[0.03] dark:text-white"
                value={totalPrice}
                onChange={(e) => setTotalPrice(Number(e.target.value))}
              />
            </label>
          </div>
        )}
        <div className="mt-6 flex justify-between">
          <button
            type="button"
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm"
            onClick={() => setStep(Math.max(1, step - 1))}
          >
            Précédent
          </button>
          {step < 3 ? (
            <button
              type="button"
              className="rounded-lg bg-brand-500 px-4 py-2 text-sm text-white"
              onClick={() => setStep(step + 1)}
            >
              Suivant
            </button>
          ) : (
            <button
              type="button"
              className="rounded-lg bg-brand-500 px-4 py-2 text-sm text-white"
              onClick={() => void submit()}
            >
              Enregistrer
            </button>
          )}
        </div>
        </div>
      </ComponentCard>
    </>
  );
}

export default function NewEventPage() {
  return (
    <Suspense
      fallback={
        <>
          <PageBreadCrumb titleKey="titles.eventsNew" />
          <p className="text-theme-sm text-gray-500 dark:text-gray-400">Chargement…</p>
        </>
      }
    >
      <NewEventInner />
    </Suspense>
  );
}
