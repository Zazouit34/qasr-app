"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import { BasicTableSurface } from "@/components/tables/BasicTableOne";
import Pagination from "@/components/tables/Pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDZD } from "@/lib/utils";

type Row = {
  id: string;
  quoteNumber: string;
  status: string;
  total: number;
  client?: { firstName: string; lastName: string };
};

const PAGE = 15;
const th =
  "px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400";

export default function QuotesPage() {
  const [items, setItems] = useState<Row[]>([]);
  const [page, setPage] = useState(1);

  useEffect(() => {
    void fetch("/api/quotes", { credentials: "include" })
      .then((r) => r.json())
      .then((j) => setItems(j.data ?? []));
  }, []);

  const totalPages = Math.max(1, Math.ceil(items.length / PAGE));
  const current = Math.min(page, totalPages);
  const slice = useMemo(() => {
    const s = (current - 1) * PAGE;
    return items.slice(s, s + PAGE);
  }, [items, current]);

  return (
    <>
      <PageBreadCrumb pageTitle="Devis" />
      <div className="space-y-4">
        <div className="flex flex-wrap justify-end gap-2">
          <Link
            href="/quotes/new"
            className="rounded-lg bg-brand-500 px-4 py-2 text-theme-sm font-medium text-white hover:bg-brand-600"
          >
            Nouveau devis
          </Link>
        </div>
        <ComponentCard title="Liste des devis" desc="">
          <BasicTableSurface>
            <Table>
              <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                <TableRow>
                  <TableCell isHeader className={th}>
                    N°
                  </TableCell>
                  <TableCell isHeader className={th}>
                    Client
                  </TableCell>
                  <TableCell isHeader className={th}>
                    Statut
                  </TableCell>
                  <TableCell isHeader className={`${th} text-end`}>
                    Total
                  </TableCell>
                  <TableCell isHeader className={`${th} w-24`}>
                    &nbsp;
                  </TableCell>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {!slice.length ? (
                  <TableRow>
                    <TableCell colSpan={5} className="px-5 py-8 text-center text-theme-sm text-gray-500 dark:text-gray-400">
                      Aucun devis.
                    </TableCell>
                  </TableRow>
                ) : (
                  slice.map((q) => (
                    <TableRow key={q.id}>
                      <TableCell className="px-5 py-3 font-mono text-theme-sm">{q.quoteNumber}</TableCell>
                      <TableCell className="px-5 py-3 text-theme-sm">
                        {q.client ? `${q.client.firstName} ${q.client.lastName}` : "—"}
                      </TableCell>
                      <TableCell className="px-5 py-3 text-theme-sm">{q.status}</TableCell>
                      <TableCell className="px-5 py-3 text-end text-theme-sm font-medium">{formatDZD(q.total)}</TableCell>
                      <TableCell className="px-5 py-3 text-end">
                        <Link href={`/quotes/${q.id}`} className="text-theme-sm font-medium text-brand-600 hover:underline">
                          Ouvrir
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </BasicTableSurface>
          {items.length > PAGE ? (
            <Pagination currentPage={current} totalPages={totalPages} onPageChange={setPage} />
          ) : null}
        </ComponentCard>
      </div>
    </>
  );
}
