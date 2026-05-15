"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Receipt } from "lucide-react";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import Pagination from "@/components/tables/Pagination";
import { BasicTableSurface } from "@/components/tables/BasicTableOne";
import Badge from "@/components/ui/badge/Badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDZD } from "@/lib/utils";

type E = {
  id: string;
  description: string;
  amount: number;
  date: string;
  category: string;
  event?: { id: string; title: string; eventNumber: string } | null;
};

const PAGE_SIZE = 10;
const th =
  "px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400";

export default function ExpensesPage() {
  const [items, setItems] = useState<E[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [eventFilter, setEventFilter] = useState("");
  const [eventOptions, setEventOptions] = useState<Array<{ id: string; title: string; eventNumber: string }>>(
    [],
  );

  useEffect(() => {
    void fetch("/api/events?limit=200", { credentials: "include" })
      .then((r) => r.json())
      .then((j) => {
        if (j.success && j.data?.items) {
          setEventOptions(
            j.data.items.map((ev: { id: string; title: string; eventNumber: string }) => ({
              id: ev.id,
              title: ev.title,
              eventNumber: ev.eventNumber,
            })),
          );
        }
      });
  }, []);

  useEffect(() => {
    const qs = eventFilter ? `?eventId=${encodeURIComponent(eventFilter)}` : "";
    void fetch(`/api/expenses${qs}`, { credentials: "include" })
      .then((r) => r.json())
      .then((j) => {
        setItems(j.data?.items ?? []);
        setTotal(j.data?.monthTotal ?? 0);
      });
    setPage(1);
  }, [eventFilter]);

  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const currentPage = Math.min(Math.max(page, 1), totalPages);

  const pageSlice = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return items.slice(start, start + PAGE_SIZE);
  }, [items, currentPage]);

  return (
    <>
      <PageBreadCrumb titleKey="titles.expenses" />
      <div className="space-y-6">
        <ComponentCard
          title={
            <span className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-brand-500" aria-hidden />
              Synthèse
            </span>
          }
          desc={`Total pour la liste affichée : ${formatDZD(total)}. Filtrez par événement pour la marge par dossier.`}
        >
          <label className="mb-6 block max-w-md text-theme-sm font-medium">
            Événement (optionnel)
            <select
              className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 shadow-theme-xs dark:border-gray-700 dark:bg-white/[0.03] dark:text-white"
              value={eventFilter}
              onChange={(e) => setEventFilter(e.target.value)}
            >
              <option value="">Toutes les dépenses</option>
              {eventOptions.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.title} ({ev.eventNumber})
                </option>
              ))}
            </select>
          </label>

          <BasicTableSurface>
            <Table>
              <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                <TableRow>
                  <TableCell isHeader className={th}>
                    Libellé
                  </TableCell>
                  <TableCell isHeader className={th}>
                    Événement
                  </TableCell>
                  <TableCell isHeader className={th}>
                    Catégorie
                  </TableCell>
                  <TableCell isHeader className={th}>
                    Date
                  </TableCell>
                  <TableCell isHeader className={`${th} text-end`}>
                    Montant
                  </TableCell>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {pageSlice.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="px-5 py-8 text-center text-theme-sm text-gray-500 dark:text-gray-400"
                    >
                      Aucune dépense enregistrée.
                    </TableCell>
                  </TableRow>
                ) : (
                  pageSlice.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell className="px-5 py-4 text-theme-sm text-gray-800 dark:text-white/90 sm:px-6">
                        {e.description}
                      </TableCell>
                      <TableCell className="px-5 py-4 text-theme-sm sm:px-6">
                        {e.event?.id ? (
                          <Link
                            href={`/events/${e.event.id}?tab=overview`}
                            className="font-medium text-brand-600 hover:underline dark:text-brand-400"
                          >
                            {e.event.eventNumber}
                          </Link>
                        ) : (
                          <span className="text-gray-400">Venue uniquement</span>
                        )}
                      </TableCell>
                      <TableCell className="px-5 py-4 sm:px-6">
                        <Badge size="sm" color="primary" variant="light">
                          {e.category || "—"}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-5 py-4 text-theme-sm text-gray-600 dark:text-gray-400 sm:px-6">
                        {new Date(e.date).toLocaleDateString("fr-FR")}
                      </TableCell>
                      <TableCell className="px-5 py-4 text-end text-theme-sm font-medium text-gray-800 dark:text-white/90 sm:px-6">
                        {formatDZD(e.amount)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </BasicTableSurface>

          {items.length > PAGE_SIZE ? (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-4 dark:border-gray-800">
              <p className="text-theme-xs text-gray-500 dark:text-gray-400">
                Page {currentPage} sur {totalPages}
              </p>
              <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setPage} />
            </div>
          ) : null}
        </ComponentCard>
      </div>
    </>
  );
}
