"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { formatDate, formatDZD } from "@/lib/utils";

export default function BriefingPrintPage() {
  const { id } = useParams<{ id: string }>();
  const [row, setRow] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    void fetch(`/api/events/${id}`, { credentials: "include" })
      .then((r) => r.json())
      .then((j) => setRow(j.data));
  }, [id]);

  type Svc = { service: { name: string }; quantity: number };
  type Am = { amenity: { name: string } };

  const venue = row?.venue as { name: string } | undefined;
  const client = row?.client as { firstName: string; lastName: string; phone: string } | undefined;
  const hall = row?.hall as { name: string } | undefined;
  const services = row?.services as Svc[] | undefined;
  const amenities = row?.amenities as Am[] | undefined;
  const payments =
    row?.payments as Array<{
      paymentNumber: string;
      amount: number;
      status: string;
      type: string;
    }> | undefined;
  const paid = Number(row?.paid ?? 0);
  const total = Number(row?.totalPrice ?? 0);
  const balance =
    typeof row?.balance === "number" ? (row.balance as number) : total - paid;

  return (
    <div className="mx-auto max-w-3xl bg-white p-8 text-black">
      <div className="mb-8 print:hidden">
        <button
          type="button"
          onClick={() => window.print()}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white"
        >
          Imprimer PDF
        </button>
      </div>
      {!row ? (
        <p>Chargement…</p>
      ) : (
        <>
          <h1 className="text-xl font-bold">Fiche événement</h1>
          <p className="text-sm text-gray-600">{venue?.name}</p>
          <h2 className="mt-4 text-lg">{String(row.title)}</h2>
          <dl className="mt-6 grid gap-2 text-theme-sm">
            <div className="flex justify-between gap-4 border-b border-gray-200 py-2">
              <dt>Date</dt>
              <dd>{row.eventDate ? formatDate(row.eventDate as string) : "—"}</dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-gray-200 py-2">
              <dt>Client</dt>
              <dd>
                {client?.firstName} {client?.lastName} · {client?.phone}
              </dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-gray-200 py-2">
              <dt>Salle</dt>
              <dd>{hall?.name ?? "—"}</dd>
            </div>
          </dl>
          <section className="mt-8">
            <h3 className="font-semibold">Services prévus</h3>
            <ul className="mt-2 list-disc pl-6 text-theme-sm">
              {services?.map((s, i) => (
                <li key={i}>
                  {s.service.name} ×{s.quantity}
                </li>
              )) ?? <li>—</li>}
            </ul>
          </section>
          <section className="mt-8">
            <h3 className="font-semibold">Aménités</h3>
            <ul className="mt-2 flex flex-wrap gap-2">
              {amenities?.map((a, i) => (
                <li key={i} className="rounded bg-gray-100 px-2 py-1 text-theme-xs">
                  {a.amenity.name}
                </li>
              )) ?? null}
              {!amenities?.length ? <li className="text-theme-sm">—</li> : null}
            </ul>
          </section>
          <section className="mt-8">
            <h3 className="font-semibold">Paiements et solde</h3>
            <p className="text-theme-sm">Total dossier : {formatDZD(total)}</p>
            <p className="text-theme-sm">Réglé : {formatDZD(paid)}</p>
            <p className="text-theme-sm font-semibold">
              À encaisser : {formatDZD(balance)}
            </p>
            <table className="mt-4 w-full text-theme-xs border border-gray-200">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-2 text-start">Réf.</th>
                  <th className="p-2">Type</th>
                  <th className="p-2 text-end">Montant</th>
                  <th className="p-2">État</th>
                </tr>
              </thead>
              <tbody>
                {payments?.map((p, i) => (
                  <tr key={i} className="border-t">
                    <td className="p-2">{p.paymentNumber}</td>
                    <td className="p-2">{p.type}</td>
                    <td className="p-2 text-end">{formatDZD(p.amount)}</td>
                    <td className="p-2">{p.status}</td>
                  </tr>
                )) ?? null}
              </tbody>
            </table>
          </section>
          <footer className="mt-14 border-t pt-4 text-[10px] text-gray-500">
            Briefing synthétique / run sheet · ne remplace pas le contrat signé · {venue?.name}
          </footer>
        </>
      )}
    </div>
  );
}
