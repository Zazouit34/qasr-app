"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Save } from "lucide-react";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import { toast } from "sonner";

const fieldClass =
  "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-white/[0.03] dark:text-white dark:placeholder:text-gray-500";

const EVENT_TYPES = [
  "WEDDING",
  "ENGAGEMENT",
  "BIRTHDAY",
  "CORPORATE",
  "BAPTISM",
  "ANNIVERSARY",
  "OTHER",
] as const;

const EVENT_STATUSES = [
  "INQUIRY",
  "QUOTE_SENT",
  "PENDING",
  "CONFIRMED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
  "NO_SHOW",
] as const;

const TYPE_LABELS: Record<(typeof EVENT_TYPES)[number], string> = {
  WEDDING: "Mariage",
  ENGAGEMENT: "Fiançailles",
  BIRTHDAY: "Anniversaire",
  CORPORATE: "Corporate",
  BAPTISM: "Baptême",
  ANNIVERSARY: "Anniversaire de mariage",
  OTHER: "Autre",
};

const STATUS_LABELS: Record<(typeof EVENT_STATUSES)[number], string> = {
  INQUIRY: "Demande",
  QUOTE_SENT: "Devis envoyé",
  PENDING: "En attente",
  CONFIRMED: "Confirmé",
  IN_PROGRESS: "En cours",
  COMPLETED: "Terminé",
  CANCELLED: "Annulé",
  NO_SHOW: "Absent",
};

export default function EditEventPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<Array<{ id: string; firstName: string; lastName: string; phone: string }>>([]);
  const [halls, setHalls] = useState<Array<{ id: string; name: string }>>([]);

  const [clientId, setClientId] = useState("");
  const [hallId, setHallId] = useState<string>("");
  const [type, setType] = useState<(typeof EVENT_TYPES)[number]>("WEDDING");
  const [status, setStatus] = useState<(typeof EVENT_STATUSES)[number]>("INQUIRY");
  const [title, setTitle] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [guestCount, setGuestCount] = useState(0);
  const [groomName, setGroomName] = useState("");
  const [brideName, setBrideName] = useState("");
  const [groomPhone, setGroomPhone] = useState("");
  const [bridePhone, setBridePhone] = useState("");
  const [basePrice, setBasePrice] = useState(0);
  const [totalPrice, setTotalPrice] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [discountReason, setDiscountReason] = useState("");
  const [notes, setNotes] = useState("");
  const [internalNotes, setInternalNotes] = useState("");
  const [contractSigned, setContractSigned] = useState(false);
  const [contractDate, setContractDate] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const [evRes, clRes, hRes] = await Promise.all([
          fetch(`/api/events/${id}`, { credentials: "include" }),
          fetch("/api/clients?limit=100&page=1", { credentials: "include" }),
          fetch("/api/halls", { credentials: "include" }),
        ]);
        const evJ = await evRes.json();
        const clJ = await clRes.json();
        const hJ = await hRes.json();

        if (cancelled) return;

        if (!evJ.success) {
          toast.error(evJ.error ?? "Événement introuvable");
          setLoading(false);
          return;
        }

        const e = evJ.data as {
          clientId?: string;
          client: { id: string };
          hallId: string | null;
          type: string;
          status: string;
          title: string;
          eventDate: string;
          startTime: string;
          endTime: string;
          guestCount: number;
          groomName: string | null;
          brideName: string | null;
          groomPhone: string | null;
          bridePhone: string | null;
          basePrice: number;
          totalPrice: number;
          discountAmount: number;
          discountReason: string | null;
          notes: string | null;
          internalNotes: string | null;
          contractSigned: boolean;
          contractDate: string | null;
        };

        setClientId(e.client?.id ?? "");
        setHallId(e.hallId ?? "");
        setType(((EVENT_TYPES as readonly string[]).includes(e.type) ? e.type : "OTHER") as (typeof EVENT_TYPES)[number]);
        setStatus(
          ((EVENT_STATUSES as readonly string[]).includes(e.status) ? e.status : "INQUIRY") as (typeof EVENT_STATUSES)[number],
        );
        setTitle(e.title);
        setEventDate(e.eventDate.slice(0, 10));
        setStartTime(e.startTime);
        setEndTime(e.endTime);
        setGuestCount(e.guestCount);
        setGroomName(e.groomName ?? "");
        setBrideName(e.brideName ?? "");
        setGroomPhone(e.groomPhone ?? "");
        setBridePhone(e.bridePhone ?? "");
        setBasePrice(e.basePrice);
        setTotalPrice(e.totalPrice);
        setDiscountAmount(e.discountAmount);
        setDiscountReason(e.discountReason ?? "");
        setNotes(e.notes ?? "");
        setInternalNotes(e.internalNotes ?? "");
        setContractSigned(e.contractSigned);
        setContractDate(e.contractDate ? e.contractDate.slice(0, 10) : "");

        if (clJ.success && clJ.data?.items)
          setClients(
            clJ.data.items.map((c: { id: string; firstName: string; lastName: string; phone: string }) => ({
              id: c.id,
              firstName: c.firstName,
              lastName: c.lastName,
              phone: c.phone,
            })),
          );

        if (hJ.success && Array.isArray(hJ.data)) setHalls(hJ.data);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  async function save() {
    if (!clientId) {
      toast.error("Choisissez un client");
      return;
    }
    const body: Record<string, unknown> = {
      clientId,
      hallId: hallId || null,
      type,
      status,
      title,
      eventDate,
      startTime,
      endTime,
      guestCount,
      groomName: groomName.trim() || null,
      brideName: brideName.trim() || null,
      groomPhone: groomPhone.trim() || null,
      bridePhone: bridePhone.trim() || null,
      basePrice,
      totalPrice,
      discountAmount,
      discountReason: discountReason.trim() || null,
      notes: notes.trim() || null,
      internalNotes: internalNotes.trim() || null,
      contractSigned,
      contractDate: contractDate ? contractDate : null,
    };

    const res = await fetch(`/api/events/${id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const j = await res.json();
    if (j.success) {
      toast.success("Enregistré");
      router.push(`/events/${id}`);
    } else toast.error(j.error);
  }

  if (loading) {
    return (
      <>
        <PageBreadCrumb titleKey="titles.eventEdit" />
        <p className="text-theme-sm text-gray-500 dark:text-gray-400">Chargement…</p>
      </>
    );
  }

  return (
    <>
      <PageBreadCrumb titleKey="titles.eventEdit" />
      <div className="mx-auto max-w-3xl space-y-6">
        <ComponentCard
          title={
            <span className="flex items-center gap-2">
              <Save className="h-5 w-5 text-brand-500" aria-hidden />
              Modifier l&apos;événement
            </span>
          }
          desc="Tous les champs correspondent au PATCH /api/events/[id]"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-theme-sm font-medium text-gray-700 dark:text-gray-300 sm:col-span-2">
              Client
              <select className={`${fieldClass} mt-1.5`} value={clientId} onChange={(e) => setClientId(e.target.value)}>
                <option value="">—</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.firstName} {c.lastName} · {c.phone}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-theme-sm font-medium text-gray-700 dark:text-gray-300 sm:col-span-2">
              Salle (optionnel)
              <select className={`${fieldClass} mt-1.5`} value={hallId} onChange={(e) => setHallId(e.target.value)}>
                <option value="">Aucune</option>
                {halls.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-theme-sm font-medium text-gray-700 dark:text-gray-300">
              Type
              <select className={`${fieldClass} mt-1.5`} value={type} onChange={(e) => setType(e.target.value as (typeof EVENT_TYPES)[number])}>
                {EVENT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {TYPE_LABELS[t]}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-theme-sm font-medium text-gray-700 dark:text-gray-300">
              Statut
              <select
                className={`${fieldClass} mt-1.5`}
                value={status}
                onChange={(e) => setStatus(e.target.value as (typeof EVENT_STATUSES)[number])}
              >
                {EVENT_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-theme-sm font-medium text-gray-700 dark:text-gray-300 sm:col-span-2">
              Titre
              <input className={`${fieldClass} mt-1.5`} value={title} onChange={(e) => setTitle(e.target.value)} />
            </label>
            <label className="block text-theme-sm font-medium text-gray-700 dark:text-gray-300">
              Date
              <input type="date" className={`${fieldClass} mt-1.5`} value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
            </label>
            <label className="block text-theme-sm font-medium text-gray-700 dark:text-gray-300">
              Début
              <input className={`${fieldClass} mt-1.5`} value={startTime} onChange={(e) => setStartTime(e.target.value)} placeholder="09:00" />
            </label>
            <label className="block text-theme-sm font-medium text-gray-700 dark:text-gray-300">
              Fin
              <input className={`${fieldClass} mt-1.5`} value={endTime} onChange={(e) => setEndTime(e.target.value)} placeholder="23:00" />
            </label>
            <label className="block text-theme-sm font-medium text-gray-700 dark:text-gray-300">
              Invités
              <input
                type="number"
                min={0}
                className={`${fieldClass} mt-1.5`}
                value={guestCount}
                onChange={(e) => setGuestCount(Number(e.target.value))}
              />
            </label>
          </div>
        </ComponentCard>

        <ComponentCard title="Couple" desc="">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-theme-sm font-medium text-gray-700 dark:text-gray-300">
              Époux
              <input className={`${fieldClass} mt-1.5`} value={groomName} onChange={(e) => setGroomName(e.target.value)} />
            </label>
            <label className="block text-theme-sm font-medium text-gray-700 dark:text-gray-300">
              Tél. époux
              <input className={`${fieldClass} mt-1.5`} value={groomPhone} onChange={(e) => setGroomPhone(e.target.value)} />
            </label>
            <label className="block text-theme-sm font-medium text-gray-700 dark:text-gray-300">
              Épouse
              <input className={`${fieldClass} mt-1.5`} value={brideName} onChange={(e) => setBrideName(e.target.value)} />
            </label>
            <label className="block text-theme-sm font-medium text-gray-700 dark:text-gray-300">
              Tél. épouse
              <input className={`${fieldClass} mt-1.5`} value={bridePhone} onChange={(e) => setBridePhone(e.target.value)} />
            </label>
          </div>
        </ComponentCard>

        <ComponentCard title="Tarifs" desc="">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-theme-sm font-medium text-gray-700 dark:text-gray-300">
              Prix de base (DA)
              <input
                type="number"
                min={0}
                step="0.01"
                className={`${fieldClass} mt-1.5`}
                value={basePrice}
                onChange={(e) => setBasePrice(Number(e.target.value))}
              />
            </label>
            <label className="block text-theme-sm font-medium text-gray-700 dark:text-gray-300">
              Total (DA)
              <input
                type="number"
                min={0}
                step="0.01"
                className={`${fieldClass} mt-1.5`}
                value={totalPrice}
                onChange={(e) => setTotalPrice(Number(e.target.value))}
              />
            </label>
            <label className="block text-theme-sm font-medium text-gray-700 dark:text-gray-300">
              Remise (DA)
              <input
                type="number"
                min={0}
                step="0.01"
                className={`${fieldClass} mt-1.5`}
                value={discountAmount}
                onChange={(e) => setDiscountAmount(Number(e.target.value))}
              />
            </label>
            <label className="block text-theme-sm font-medium text-gray-700 dark:text-gray-300 sm:col-span-2">
              Motif remise
              <input className={`${fieldClass} mt-1.5`} value={discountReason} onChange={(e) => setDiscountReason(e.target.value)} />
            </label>
          </div>
        </ComponentCard>

        <ComponentCard title="Notes" desc="">
          <label className="block text-theme-sm font-medium text-gray-700 dark:text-gray-300">
            Notes client
            <textarea className={`${fieldClass} mt-1.5 min-h-[88px]`} value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} />
          </label>
          <label className="mt-4 block text-theme-sm font-medium text-gray-700 dark:text-gray-300">
            Notes internes
            <textarea
              className={`${fieldClass} mt-1.5 min-h-[88px]`}
              value={internalNotes}
              onChange={(e) => setInternalNotes(e.target.value)}
              rows={4}
            />
          </label>
        </ComponentCard>

        <ComponentCard title="Contrat" desc="">
          <label className="flex cursor-pointer items-center gap-2 text-theme-sm font-medium text-gray-700 dark:text-gray-300">
            <input type="checkbox" checked={contractSigned} onChange={(e) => setContractSigned(e.target.checked)} className="rounded border-gray-300" />
            Contrat signé
          </label>
          <label className="mt-4 block text-theme-sm font-medium text-gray-700 dark:text-gray-300">
            Date de signature
            <input
              type="date"
              className={`${fieldClass} mt-1.5`}
              value={contractDate}
              onChange={(e) => setContractDate(e.target.value)}
            />
          </label>
        </ComponentCard>

        <button
          type="button"
          className="rounded-lg bg-brand-500 px-5 py-2.5 text-theme-sm font-medium text-white shadow-theme-xs hover:bg-brand-600"
          onClick={() => void save()}
        >
          Enregistrer
        </button>
      </div>
    </>
  );
}
