"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

type LineRow = {
  label: string;
  qty?: number;
  unitPrice?: number;
  total?: number;
};

type Data = {
  quoteNumber: string;
  venueName: string;
  venuePhone: string;
  total: number;
  status: string;
  lineItems: LineRow[];
  validUntil: string | null;
  proposalEventDate: string | null;
  clientFirstName: string;
  title?: string | null;
  notes?: string | null;
};

export default function PublicQuotePage() {
  const { token } = useParams<{ token: string }>();
  const [d, setD] = useState<Data | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    void fetch(`/api/public/quotes/${token}`)
      .then((r) => r.json())
      .then((j) => {
        if (j.success) setD(j.data);
        else setErr(j.error ?? "Erreur");
      });
  }, [token]);

  async function accept() {
    setBusy(true);
    try {
      const r = await fetch(`/api/public/quotes/${token}/accept`, {
        method: "POST",
      });
      const j = await r.json();
      if (j.success) {
        setDone(true);
      } else {
        setErr(j.error ?? "Refus.");
      }
    } finally {
      setBusy(false);
    }
  }

  if (err) return <main className="mx-auto max-w-lg p-8 text-red-700">{err}</main>;
  if (!d)
    return <main className="mx-auto max-w-lg p-8 text-theme-sm text-gray-500">Chargement…</main>;

  const open =
    (d.status === "DRAFT" || d.status === "SENT") &&
    (!d.validUntil || new Date(d.validUntil) >= new Date());

  return (
    <main className="mx-auto max-w-xl bg-gray-50 p-8 text-gray-900">
      <h1 className="text-xl font-semibold">{d.venueName}</h1>
      <p className="text-sm text-gray-600">{d.venuePhone}</p>
      <p className="mt-4 font-mono text-sm">Devis {d.quoteNumber}</p>
      {d.title ? <p className="mt-2 font-medium">{d.title}</p> : null}
      <p className="text-sm">Cher/chère {d.clientFirstName},</p>
      <table className="mt-6 w-full text-sm bg-white rounded-lg overflow-hidden border border-gray-200">
        <thead>
          <tr className="bg-gray-100 text-left">
            <th className="p-2 border-b">Article</th>
            <th className="p-2 border-b text-end">Total</th>
          </tr>
        </thead>
        <tbody>
          {d.lineItems.map((l, idx) => (
            <tr key={idx}>
              <td className="p-2 border-b">{l.label}</td>
              <td className="p-2 border-b text-end">{l.total?.toLocaleString("fr-DZ")} DZD</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-4 text-end text-lg font-semibold">{d.total.toLocaleString("fr-DZ")} DZD</p>
      {d.validUntil ? (
        <p className="text-xs text-gray-500">Expire le {new Date(d.validUntil).toLocaleDateString("fr-FR")}</p>
      ) : null}
      {d.proposalEventDate ? (
        <p className="text-xs text-gray-600">Date envisagée : {new Date(d.proposalEventDate).toLocaleDateString("fr-FR")}</p>
      ) : null}
      {open && (
        <div className="mt-8 flex flex-wrap gap-3">
          <button
            type="button"
            disabled={busy || done}
            onClick={() => void accept()}
            className="rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {done ? "Accepté ✓" : busy ? "…" : "Accepter le devis"}
          </button>
        </div>
      )}
      {!open && (
        <p className="mt-6 text-sm text-gray-600">Ce devis ne peut plus être accepté ({d.status}).</p>
      )}
      {done && <p className="mt-4 text-green-700">Merci — votre dossier sera confirmé par le lieu sous peu.</p>}
    </main>
  );
}
