"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

type Menu = {
  name: string;
  groceryItems: Array<{ ingredient: string; approxQty: string | null; unit: string | null }>;
};

export default function MenuGroceryPrintPage() {
  const { id } = useParams<{ id: string }>();
  const [menu, setMenu] = useState<Menu | null>(null);

  useEffect(() => {
    void fetch(`/api/menu-templates/${id}`, { credentials: "include" })
      .then((r) => r.json())
      .then((j) => {
        if (j.success) setMenu(j.data as Menu);
      });
  }, [id]);

  return (
    <div className="mx-auto max-w-2xl bg-white p-10 text-black">
      <button type="button" className="mb-8 rounded-lg bg-brand-600 px-4 py-2 text-sm text-white print:hidden" onClick={() => window.print()}>
        Liste courses PDF
      </button>
      {!menu ? (
        <p>Chargement…</p>
      ) : (
        <>
          <h1 className="text-2xl font-semibold">{menu.name}</h1>
          <p className="mt-2 text-theme-sm text-gray-700">Liste indicative pour achats hors traiteur (client ou famille).</p>
          <table className="mt-8 w-full text-sm border border-gray-200">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2 border-b text-start">Article</th>
                <th className="p-2 border-b text-start">Qty</th>
                <th className="p-2 border-b text-start">Unité</th>
              </tr>
            </thead>
            <tbody>
              {menu.groceryItems.map((g, i) => (
                <tr key={i} className="border-t border-gray-200">
                  <td className="p-2">{g.ingredient}</td>
                  <td className="p-2">{g.approxQty ?? "—"}</td>
                  <td className="p-2">{g.unit ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-8 text-xs text-gray-500">Liste non contractuelle · quantités à ajuster avec votre traiteur.</p>
        </>
      )}
    </div>
  );
}
