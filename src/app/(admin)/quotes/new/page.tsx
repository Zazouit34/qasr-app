"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import type { Client, Hall } from "@prisma/client";
import { toast } from "sonner";

export default function NewQuotePage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [halls, setHalls] = useState<Hall[]>([]);
  const [clientId, setClientId] = useState("");
  const [title, setTitle] = useState("");
  const [proposalDate, setProposalDate] = useState("");
  const [proposalHallId, setProposalHallId] = useState("");
  const [proposalGuests, setProposalGuests] = useState(150);
  const [notes, setNotes] = useState("");
  const [lineLabel, setLineLabel] = useState("Locaton salle");
  const [lineQty, setLineQty] = useState(1);
  const [linePrice, setLinePrice] = useState(500_000);
  const [validUntil, setValidUntil] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void fetch("/api/clients?limit=200", { credentials: "include" })
      .then((r) => r.json())
      .then((j) => setClients(j.data?.items ?? []));
    void fetch("/api/halls", { credentials: "include" })
      .then((r) => r.json())
      .then((j) => {
        const hh = j.data ?? [];
        setHalls(hh);
        if (hh[0]?.id) setProposalHallId(hh[0].id);
      });
  }, []);

  async function submit() {
    if (!clientId || !proposalDate || !proposalHallId) {
      toast.error("Client, date proposée et salle sont requis pour le lien client.");
      return;
    }
    setLoading(true);
    try {
      const total = lineQty * linePrice;
      const res = await fetch("/api/quotes", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          title: title || null,
          lineItems: [
            {
              label: lineLabel,
              qty: lineQty,
              unitPrice: linePrice,
              total,
            },
          ],
          total,
          notes: notes || null,
          proposalEventDate: proposalDate,
          proposalHallId,
          proposalGuests,
          validUntil: validUntil || null,
        }),
      });
      const j = await res.json();
      if (!j.success) {
        toast.error(j.error ?? "Erreur");
        return;
      }
      toast.success("Devis créé");
      router.push(`/quotes/${j.data.id}`);
    } finally {
      setLoading(false);
    }
  }

  const field =
    "mt-1.5 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-theme-xs dark:border-gray-700 dark:bg-white/[0.03] dark:text-white";

  return (
    <>
      <PageBreadCrumb pageTitle="Nouveau devis" />
      <ComponentCard title="Informations proposition" desc="Le client pourra valider en ligne lorsque vous lui transmettrez le lien public.">
        <div className="mx-auto max-w-xl space-y-4">
          <label className="block text-theme-sm font-medium">
            Client
            <select className={field} value={clientId} onChange={(e) => setClientId(e.target.value)}>
              <option value="">—</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.firstName} {c.lastName}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-theme-sm font-medium">
            Objet du devis (optionnel)
            <input className={field} value={title} onChange={(e) => setTitle(e.target.value)} />
          </label>
          <label className="block text-theme-sm font-medium">
            Date d’événement souhaitée
            <input type="date" className={field} value={proposalDate} onChange={(e) => setProposalDate(e.target.value)} />
          </label>
          <label className="block text-theme-sm font-medium">
            Salle proposée
            <select className={field} value={proposalHallId} onChange={(e) => setProposalHallId(e.target.value)}>
              {halls.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-theme-sm font-medium">
            Invités estimés
            <input type="number" min={10} className={field} value={proposalGuests} onChange={(e) => setProposalGuests(Number(e.target.value))} />
          </label>
          <fieldset className="rounded-xl border border-gray-100 p-4 dark:border-gray-800">
            <legend className="text-theme-sm font-medium">Ligne montant principal</legend>
            <label className="mt-3 block">
              Libellé
              <input className={field} value={lineLabel} onChange={(e) => setLineLabel(e.target.value)} />
            </label>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label>
                Quantité
                <input type="number" min={1} className={field} value={lineQty} onChange={(e) => setLineQty(Number(e.target.value))} />
              </label>
              <label>
                Prix unitaire (DZD)
                <input type="number" className={field} value={linePrice} onChange={(e) => setLinePrice(Number(e.target.value))} />
              </label>
            </div>
            <p className="mt-3 text-theme-sm font-medium text-brand-700 dark:text-brand-300">
              Total : {(lineQty * linePrice).toLocaleString("fr-DZ")} DZD
            </p>
          </fieldset>
          <label className="block text-theme-sm font-medium">
            Validité jusqu’au (optionnel)
            <input type="date" className={field} value={validUntil} onChange={(e) => setValidUntil(e.target.value)} />
          </label>
          <label className="block text-theme-sm font-medium">
            Notes internes (non montrées sur le lien public tel quel)
            <textarea rows={3} className={field} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </label>
          <button
            type="button"
            disabled={loading}
            onClick={() => void submit()}
            className="w-full rounded-lg bg-brand-500 py-3 text-theme-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
          >
            Créer le devis
          </button>
        </div>
      </ComponentCard>
    </>
  );
}
