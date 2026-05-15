"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { formatDateTime, formatDZD } from "@/lib/utils";
import { toast } from "sonner";

export default function ReceiptPrintPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [p, setP] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    void fetch(`/api/payments/${id}`, { credentials: "include" })
      .then((r) => r.json())
      .then((j) => setP(j.data));
  }, [id]);

  async function saveReceiptLink() {
    const url =
      typeof window !== "undefined" ? `${window.location.origin}/payments/${id}/receipt-print` : "";
    const res = await fetch(`/api/payments/${id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ receiptUrl: url }),
    });
    const j = await res.json();
    if (j.success) toast.success("Lien du reçu enregistré");
    else toast.error(j.error ?? "Erreur");
  }

  const venue = p?.venue as { name: string } | undefined;
  const evt = p?.event as
    | { title: string; eventNumber: string; client?: { firstName: string; lastName: string } | null }
    | undefined;

  return (
    <div className="mx-auto max-w-md bg-white p-10 text-black">
      <div className="mb-6 flex gap-2 print:hidden">
        <button type="button" className="rounded-lg bg-brand-600 px-3 py-2 text-sm text-white" onClick={() => window.print()}>
          PDF
        </button>
        <button type="button" className="rounded-lg border px-3 py-2 text-sm" onClick={() => void saveReceiptLink()}>
          Enregistrer sur le dossier
        </button>
      </div>

      {!p ? (
        <p>…</p>
      ) : (
        <>
          <header className="text-center border-b pb-6">
            <h1 className="text-xl font-semibold">{venue?.name ?? "Pièce décaissance"}</h1>
            <p className="mt-4 text-xs uppercase tracking-wide text-gray-600">Reçu de paiement</p>
            <p className="font-mono text-lg">{String(p.paymentNumber)}</p>
          </header>
            <dl className="mt-8 space-y-3 text-theme-sm">
            <div className="flex justify-between gap-8">
              <dt>Événement</dt>
              <dd className="text-end font-medium">{evt?.title ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-8">
              <dt>N° événement</dt>
              <dd>{evt?.eventNumber ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-8">
              <dt>Client</dt>
              <dd>
                {evt?.client ? `${evt.client.firstName} ${evt.client.lastName}` : "—"}
              </dd>
            </div>
            <div className="flex justify-between gap-8">
              <dt>Montant</dt>
              <dd className="font-semibold text-lg">{formatDZD(Number(p.amount))}</dd>
            </div>
            <div className="flex justify-between gap-8">
              <dt>Mode</dt>
              <dd>{String(p.method)}</dd>
            </div>
            <div className="flex justify-between gap-8">
              <dt>Statut</dt>
              <dd>{String(p.status)}</dd>
            </div>
            {p.paidAt ? (
              <div className="flex justify-between gap-8">
                <dt>Date</dt>
                <dd>{formatDateTime(p.paidAt as string)}</dd>
              </div>
            ) : null}
          </dl>
          <section className="mt-14 border-t pt-6 text-[10px] leading-relaxed">
            <p className="font-semibold mb-2">FR / AR ملخص مستنتج</p>
            <p>Reçu généré par le dossier événements — vérifiable auprès du lieu ou sur les relevés bancaires.</p>
          </section>
        </>
      )}
    </div>
  );
}
