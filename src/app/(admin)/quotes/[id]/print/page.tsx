"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { formatDZD } from "@/lib/utils";

type Line = { label: string; qty?: number; unitPrice?: number; total?: number };

export default function QuotePrintPage() {
  const params = useParams();
  const id = params.id as string;
  const [data, setData] = useState<{
    quoteNumber: string;
    title: string | null;
    total: number;
    lineItems: unknown;
    client: { firstName: string; lastName: string };
    venue: { name: string; phone: string; address: string; city: string };
  } | null>(null);

  useEffect(() => {
    void fetch(`/api/quotes/${id}`, { credentials: "include" })
      .then((r) => r.json())
      .then((j) => {
        if (j.success && j.data) {
          void fetch(`/api/venue`, { credentials: "include" })
            .then((vr) => vr.json())
            .then((vj) => {
              if (!vj.success) return;
              setData({
                quoteNumber: j.data.quoteNumber,
                title: j.data.title,
                total: j.data.total,
                lineItems: j.data.lineItems,
                client: j.data.client,
                venue: {
                  name: vj.data.name,
                  phone: vj.data.phone,
                  address: vj.data.address,
                  city: vj.data.city,
                },
              });
            });
        }
      });
  }, [id]);

  const lines =
    data?.lineItems && Array.isArray(data.lineItems)
      ? (data.lineItems as Line[])
      : [];

  return (
    <div className="mx-auto max-w-3xl bg-white p-8 text-black print:p-12">
      {!data ? (
        <p>Chargement…</p>
      ) : (
        <>
          <header className="border-b pb-6">
            <h1 className="text-2xl font-semibold">{data.venue.name}</h1>
            <p className="text-sm text-gray-700">
              {data.venue.address} · {data.venue.city} · {data.venue.phone}
            </p>
            <div className="mt-6 flex justify-between gap-8">
              <div>
                <p className="text-xs uppercase text-gray-600">DEVIS</p>
                <p className="text-xl font-mono">{data.quoteNumber}</p>
              </div>
              <div className="text-end text-sm">
                <p>
                  {data.client.firstName} {data.client.lastName}
                </p>
              </div>
            </div>
          </header>
          {data.title ? <p className="mt-4 font-medium">{data.title}</p> : null}
          <table className="mt-8 w-full border-collapse border border-gray-300 text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 p-2 text-start">Article</th>
                <th className="border border-gray-300 p-2 text-end">Qté</th>
                <th className="border border-gray-300 p-2 text-end">P.U.</th>
                <th className="border border-gray-300 p-2 text-end">Total</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((row, idx) => (
                <tr key={idx}>
                  <td className="border border-gray-300 p-2">{row.label}</td>
                  <td className="border border-gray-300 p-2 text-end">{row.qty ?? 1}</td>
                  <td className="border border-gray-300 p-2 text-end">
                    {formatDZD(row.unitPrice ?? row.total ?? 0)}
                  </td>
                  <td className="border border-gray-300 p-2 text-end font-medium">
                    {formatDZD(row.total ?? row.unitPrice ?? 0)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-6 text-end text-lg font-semibold">Total {formatDZD(data.total)}</p>
          <section className="mt-10 border-t pt-4 text-xs text-gray-700">
            <p className="font-semibold">FR</p>
            <p>Conditions générales sur demande.</p>
            <p className="mt-3 font-semibold" dir="rtl">
              العربية
            </p>
            <p dir="rtl">الشروط العامة متوفرة عند الطلب.</p>
          </section>
        </>
      )}
    </div>
  );
}
