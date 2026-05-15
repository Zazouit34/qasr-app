"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { formatDate, formatDZD } from "@/lib/utils";
import { toast } from "sonner";

export default function ContractPrintPage() {
  const { id } = useParams<{ id: string }>();
  const [row, setRow] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    void fetch(`/api/events/${id}`, { credentials: "include" })
      .then((r) => r.json())
      .then((j) => setRow(j.data));
  }, [id]);

  async function persistContractUrl() {
    const url =
      typeof window !== "undefined" ? `${window.location.origin}/events/${id}/contract-print` : "";
    const res = await fetch(`/api/events/${id}/contract`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileUrl: url }),
    });
    const j = await res.json();
    if (j.success) toast.success("Lien du contrat enregistré");
    else toast.error(j.error ?? "Erreur");
  }

  const venue = row?.venue as
    | { name: string; address: string; city: string; phone: string; email: string; logoUrl: string | null }
    | undefined;
  const client = row?.client as
    | { firstName: string; lastName: string; phone: string; wilaya?: string | null }
    | undefined;
  const hall = row?.hall as { name: string } | null | undefined;
  const eventDate = row?.eventDate as string | undefined;
  const totalPrice = Number(row?.totalPrice ?? 0);
  const title = row?.title as string | undefined;

  return (
    <div className="mx-auto max-w-4xl bg-white p-10 text-black print:p-14">
      <div className="mb-8 flex gap-4 print:hidden">
        <button
          type="button"
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white"
          onClick={() => window.print()}
        >
          Imprimer PDF
        </button>
        <button
          type="button"
          className="rounded-lg border px-4 py-2 text-sm dark:border-gray-600"
          onClick={() => void persistContractUrl()}
        >
          Enregistrer le lien sur le dossier
        </button>
      </div>

      {!row || !venue ? (
        <p>Chargement…</p>
      ) : (
        <>
          <header className="flex justify-between border-b pb-8">
            <div>
              <h1 className="text-2xl font-semibold">{venue.name}</h1>
              <p className="text-sm">
                {venue.address} · {venue.city}
              </p>
              <p className="text-sm">{venue.phone}</p>
            </div>
            <div className="text-end text-sm leading-relaxed">
              <p className="font-semibold">{client?.firstName} {client?.lastName}</p>
              <p>{client?.phone}</p>
            </div>
          </header>
          <section className="mt-8">
            <h2 className="text-lg font-medium">Contrat de prestation événementielle</h2>
            <p className="mt-2">{title}</p>
            <p className="text-sm">Événement : {eventDate ? formatDate(eventDate) : "—"}</p>
            <p className="text-sm">Salle : {hall?.name ?? "—"}</p>
            <p className="mt-4 text-xl font-semibold">Montant principal {formatDZD(totalPrice)}</p>
          </section>
          <section className="mt-12 border-t pt-6 text-xs leading-relaxed text-gray-900">
            <p className="font-semibold">FR — Clause de base</p>
            <p>
              Le présent cadre peut être annoté puis signé avant réalisation du service. Modalités complémentaires peuvent faire l’objet d’un accord écrit.
              Annulations et conditions légales : consulter le règlement interne communiqué par le lieu ou mentionné sur vos devis.
            </p>
            <div className="mt-10 grid gap-16 sm:grid-cols-2">
              <div>
                <p className="mb-24 border-t border-black pt-1">Signature représentant du lieu</p>
              </div>
              <div>
                <p className="mb-24 border-t border-black pt-1">Signature client(e)</p>
              </div>
            </div>
            <div className="mt-14 border-t pt-4 font-semibold" dir="rtl">
              العربية
            </div>
            <p className="text-right mt-2" dir="rtl">
              هذا المستند قابل للقراءة فقط قبل التوقيع. يتم تطبيق الشروط المذكورة في الفاتورة والعرض وفقًا لقواعد المنشأة.
              يمكن إلغاء الحجز وفق أيام الإشعار المحددة بين الطرفين.
            </p>
          </section>
        </>
      )}
    </div>
  );
}
