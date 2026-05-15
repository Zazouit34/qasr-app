"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import { formatDZD } from "@/lib/utils";
import { toast } from "sonner";

type QuoteDetail = {
  id: string;
  quoteNumber: string;
  acceptanceToken: string;
  status: string;
  total: number;
  title: string | null;
  notes: string | null;
  validUntil: string | null;
};

export default function QuoteDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [q, setQ] = useState<QuoteDetail | null>(null);

  useEffect(() => {
    void fetch(`/api/quotes/${id}`, { credentials: "include" })
      .then((r) => r.json())
      .then((j) => {
        if (j.success) setQ(j.data);
        else toast.error(j.error ?? "Erreur");
      });
  }, [id]);

  const publicUrl =
    typeof window !== "undefined" && q
      ? `${window.location.origin}/quote/${q.acceptanceToken}`
      : "";

  async function markSent() {
    const res = await fetch(`/api/quotes/${id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "SENT" }),
    });
    const j = await res.json();
    if (!j.success) {
      toast.error(j.error ?? "Erreur");
      return;
    }
    setQ((prev) => (prev ? { ...prev, status: "SENT" } : prev));
    toast.success("Statut mis à jour");
  }

  async function copyPublic() {
    if (!publicUrl) return;
    try {
      await navigator.clipboard.writeText(publicUrl);
      toast.success("Lien copié");
    } catch {
      toast.error("Copie impossible — copiez à la main.");
    }
  }

  if (!q) {
    return (
      <>
        <PageBreadCrumb pageTitle="Devis" />
        <p className="p-6 text-theme-sm text-gray-500">Chargement…</p>
      </>
    );
  }

  return (
    <>
      <PageBreadCrumb pageTitle={`Devis ${q.quoteNumber}`} />
      <div className="space-y-6">
        <ComponentCard title={`${q.quoteNumber} — ${q.status}`} desc="">
          <div className="flex flex-wrap gap-3">
            <Link
              href={`/quotes/${id}/print`}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-theme-sm dark:border-gray-600 dark:bg-white/[0.04]"
              target="_blank"
            >
              Aperçu / impression PDF
            </Link>
            <button
              type="button"
              className="rounded-lg bg-brand-500 px-4 py-2 text-theme-sm font-medium text-white"
              onClick={() => void copyPublic()}
            >
              Copier le lien client
            </button>
            <button
              type="button"
              className="rounded-lg border border-gray-300 px-4 py-2 text-theme-sm dark:border-gray-600"
              onClick={() => void markSent()}
            >
              Marquer envoyé
            </button>
          </div>
          <p className="mt-4 text-theme-sm text-gray-600 dark:text-gray-400">
            Montant : <span className="font-semibold text-gray-900 dark:text-white">{formatDZD(q.total)}</span>
          </p>
          {q.validUntil ? (
            <p className="text-theme-xs text-gray-500">Validité : {new Date(q.validUntil).toLocaleDateString("fr-FR")}</p>
          ) : null}
          {q.title ? <p className="mt-2 text-theme-sm font-medium">{q.title}</p> : null}
          {q.notes ? <p className="mt-2 whitespace-pre-wrap text-theme-sm text-gray-600 dark:text-gray-400">{q.notes}</p> : null}
          <p className="mt-4 break-all text-theme-xs text-gray-500 dark:text-gray-400">{publicUrl}</p>
        </ComponentCard>
      </div>
    </>
  );
}
