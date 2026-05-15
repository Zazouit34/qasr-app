"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function PublicAvailabilityPage() {
  const params = useParams<{ slug: string }>();
  const slug = decodeURIComponent(params.slug);
  const [busy, setBusy] = useState<string[]>([]);
  const [name, setName] = useState<string>("");

  useEffect(() => {
    void fetch(`/api/public/venues/${slug}/availability`)
      .then((r) => r.json())
      .then((j) => {
        if (j.success) {
          setBusy(j.data.busyDates as string[]);
          setName(j.data.venueName as string);
        }
      });
  }, [slug]);

  return (
    <main className="mx-auto max-w-xl p-8 text-gray-900">
      <h1 className="text-2xl font-semibold">{name || "Disponibilité"}</h1>
      <p className="mt-3 text-theme-sm text-gray-600">
        Dates où un événement est déjà enregistré (sans mention des clients — protection de la vie privée).
      </p>
      <div className="mt-8 rounded-xl border border-gray-200 bg-white shadow-sm">
        {!busy.length ? (
          <p className="p-6 text-theme-sm text-gray-500">
            Pas de données affichées (ou aucune réservation hors annulées).
          </p>
        ) : (
          <ul className="divide-y">
            {busy.map((d) => (
              <li key={d} className="px-5 py-3 text-theme-sm">
                Occupé · {new Date(d + "T12:00:00").toLocaleDateString("fr-FR")}
              </li>
            ))}
          </ul>
        )}
      </div>
      <p className="mt-8 text-xs text-gray-500">Pour réservation : contactez le lieu directement.</p>
    </main>
  );
}
