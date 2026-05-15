"use client";

import { useEffect, useMemo, useState } from "react";
import { Users } from "lucide-react";
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
import { formatDZD } from "@/lib/utils";
import type { StaffMember } from "@prisma/client";

const PAGE_SIZE = 10;
const th =
  "px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400";

export default function StaffPage() {
  const [items, setItems] = useState<StaffMember[]>([]);
  const [page, setPage] = useState(1);

  useEffect(() => {
    void fetch("/api/staff", { credentials: "include" })
      .then((r) => r.json())
      .then((j) => setItems(j.data ?? []));
  }, []);

  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const currentPage = Math.min(Math.max(page, 1), totalPages);

  const pageSlice = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return items.slice(start, start + PAGE_SIZE);
  }, [items, currentPage]);

  return (
    <>
      <PageBreadCrumb titleKey="titles.staff" />
      <div className="space-y-6">
        <ComponentCard
          title={
            <span className="flex items-center gap-2">
              <Users className="h-5 w-5 text-brand-500" aria-hidden />
              Équipe
            </span>
          }
          desc="Rôles, contacts et salaires."
        >
          <BasicTableSurface>
            <Table>
              <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                <TableRow>
                  <TableCell isHeader className={th}>
                    Nom
                  </TableCell>
                  <TableCell isHeader className={th}>
                    Rôle
                  </TableCell>
                  <TableCell isHeader className={th}>
                    Téléphone
                  </TableCell>
                  <TableCell isHeader className={`${th} text-end`}>
                    Salaire
                  </TableCell>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {pageSlice.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="px-5 py-8 text-center text-theme-sm text-gray-500 dark:text-gray-400"
                    >
                      Aucun membre du staff.
                    </TableCell>
                  </TableRow>
                ) : (
                  pageSlice.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="px-5 py-4 font-medium text-gray-800 text-theme-sm dark:text-white/90 sm:px-6">
                        {s.name}
                      </TableCell>
                      <TableCell className="px-5 py-4 text-theme-sm text-gray-600 dark:text-gray-400 sm:px-6">
                        {s.role}
                      </TableCell>
                      <TableCell className="px-5 py-4 text-theme-sm text-gray-600 dark:text-gray-400 sm:px-6">
                        {s.phone || "—"}
                      </TableCell>
                      <TableCell className="px-5 py-4 text-end text-theme-sm text-gray-800 dark:text-white/90 sm:px-6">
                        {s.salary != null ? formatDZD(s.salary) : "—"}
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
