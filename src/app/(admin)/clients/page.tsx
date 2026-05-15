"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { UserPlus } from "lucide-react";
import { whatsappHref } from "@/lib/whatsapp";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import Pagination from "@/components/tables/Pagination";
import { BasicTableSurface } from "@/components/tables/BasicTableOne";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const PAGE_SIZE = 10;

const th =
  "px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400";

export default function ClientsPage() {
  const [items, setItems] = useState<
    Array<{ id: string; firstName: string; lastName: string; phone: string }>
  >([]);
  const [page, setPage] = useState(1);

  useEffect(() => {
    void fetch("/api/clients?limit=200", { credentials: "include" })
      .then((r) => r.json())
      .then((j) => setItems(j.data?.items ?? []));
  }, []);

  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const currentPage = Math.min(Math.max(page, 1), totalPages);

  const pageSlice = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return items.slice(start, start + PAGE_SIZE);
  }, [items, currentPage]);

  return (
    <>
      <PageBreadCrumb titleKey="titles.clients" />
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {items.length} client{items.length === 1 ? "" : "s"} en base
          </p>
          <Link
            href="/clients/new"
            className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
          >
            <UserPlus className="h-4 w-4" aria-hidden />
            Ajouter client
          </Link>
        </div>

        <ComponentCard title="Annuaire" desc="Liste des clients et accès aux fiches.">
          <BasicTableSurface>
            <Table>
              <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                <TableRow>
                  <TableCell isHeader className={th}>
                    Client
                  </TableCell>
                  <TableCell isHeader className={th}>
                    Téléphone
                  </TableCell>
                  <TableCell isHeader className={`${th} w-24`}>
                    WhatsApp
                  </TableCell>
                  <TableCell isHeader className={`${th} w-28`}>
                    &nbsp;
                  </TableCell>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {pageSlice.length === 0 ? (
                  <TableRow>
                    <TableCell className="px-5 py-8 text-center text-theme-sm text-gray-500 dark:text-gray-400" colSpan={4}>
                      Aucun client pour le moment.
                    </TableCell>
                  </TableRow>
                ) : (
                  pageSlice.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="px-5 py-4 sm:px-6">
                        <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                          {c.firstName} {c.lastName}
                        </span>
                      </TableCell>
                      <TableCell className="px-5 py-4 text-theme-sm text-gray-600 dark:text-gray-400 sm:px-6">
                        {c.phone || "—"}
                      </TableCell>
                      <TableCell className="px-5 py-4 sm:px-6">
                        {c.phone ? (
                          <a
                            href={whatsappHref(
                              c.phone,
                              `Bonjour ${c.firstName}, informations concernant votre réservation.`,
                            )}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-theme-sm font-medium text-[#128C7E] hover:underline"
                          >
                            WA
                          </a>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell className="px-5 py-4 text-end sm:px-6">
                        <Link href={`/clients/${c.id}`} className="text-sm font-medium text-brand-600 hover:text-brand-500 dark:text-brand-400">
                          Ouvrir
                        </Link>
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
