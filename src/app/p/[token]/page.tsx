"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function ClientPortalPage() {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<{
    venueName: string;
    venueContact: string;
    eventTitle: string;
    eventNumber: string;
    eventDate: string;
    hallName: string | null;
    guestCount: number;
    totalPrice: number;
    paid: number;
    balance: number;
    payments: Array<{ paymentNumber: string; amount: number; status: string; dueDate: string | null }>;
  } | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    void fetch(`/api/public/portal/${token}`)
      .then((r) => r.json())
      .then((j) => {
        if (j.success) setData(j.data);
        else setErr(j.error ?? "Erreur");
      });
  }, [token]);

  if (err) return <main className="mx-auto max-w-lg p-8 text-red-700">{err}</main>;
  if (!data) return <main className="p-8 text-center text-gray-600">…</main>;

  return (
    <main className="mx-auto max-w-lg space-y-4 p-8 text-gray-900">
      <header>
        <h1 className="text-xl font-semibold">{data.venueName}</h1>
        <p className="text-sm text-gray-600">{data.venueContact}</p>
      </header>
      <section className="rounded-xl border bg-white p-4">
        <h2 className="font-medium">{data.eventTitle}</h2>
        <p className="text-theme-xs font-mono text-gray-600">{data.eventNumber}</p>
        <dl className="mt-4 space-y-1 text-theme-sm">
          <div className="flex justify-between">
            <dt>Date</dt>
            <dd>{new Date(data.eventDate).toLocaleDateString("fr-FR")}</dd>
          </div>
          {data.hallName ? (
            <div className="flex justify-between">
              <dt>Salle</dt>
              <dd>{data.hallName}</dd>
            </div>
          ) : null}
          <div className="flex justify-between">
            <dt>Invités</dt>
            <dd>{data.guestCount}</dd>
          </div>
          <div className="flex justify-between font-semibold border-t pt-2 mt-2">
            <dt>Solde</dt>
            <dd>{data.balance.toLocaleString("fr-DZ")} DZD</dd>
          </div>
        </dl>
      </section>
      <section>
        <h3 className="text-sm font-semibold text-gray-600">Échéancier</h3>
        <ul className="mt-2 divide-y rounded-lg border bg-white text-theme-sm">
          {data.payments.map((p) => (
            <li key={p.paymentNumber} className="flex justify-between px-3 py-2">
              <span>{p.paymentNumber}</span>
              <span>{p.amount.toLocaleString("fr-DZ")} DZD · {p.status}</span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
