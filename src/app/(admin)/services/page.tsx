"use client";

import { useEffect, useMemo, useState } from "react";
import { Briefcase } from "lucide-react";
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
import { serviceIconFor } from "@/lib/lucide-entity-icons";
import type { Service, ServiceCategory } from "@prisma/client";

const PAGE_SIZE = 10;
const th =
  "px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400";

const categoryLabel: Record<ServiceCategory, string> = {
  CATERING: "Restauration",
  MUSIC: "Musique",
  PHOTO_VIDEO: "Photo & vidéo",
  DECORATION: "Décoration",
  CAKE: "Gâteau",
  FLOWERS: "Fleurs",
  LIGHTING: "Éclairage",
  TRANSPORT: "Transport",
  BEAUTY: "Coiffure / beauté",
  HOSTING: "Accueil",
  SECURITY: "Sécurité",
  CLEANING: "Nettoyage",
  OTHER: "Autre",
};

export default function ServicesPage() {
  const [items, setItems] = useState<Service[]>([]);
  const [page, setPage] = useState(1);

  useEffect(() => {
    void fetch("/api/services", { credentials: "include" })
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
      <PageBreadCrumb titleKey="titles.services" />
      <ComponentCard
        title={
          <span className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-brand-500" aria-hidden />
            Prestations
          </span>
        }
        desc="Services additionnels catalogue."
      >
        <BasicTableSurface>
          <Table>
            <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
              <TableRow>
                <TableCell isHeader className={`${th} w-14`} aria-label="Icône">
                  {""}
                </TableCell>
                <TableCell isHeader className={th}>
                  Nom
                </TableCell>
                <TableCell isHeader className={th}>
                  Catégorie
                </TableCell>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {pageSlice.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    className="px-5 py-8 text-center text-theme-sm text-gray-500 dark:text-gray-400"
                  >
                    Aucun service.
                  </TableCell>
                </TableRow>
              ) : (
                pageSlice.map((s) => {
                  const Icon = serviceIconFor(s.name, s.category);
                  return (
                    <TableRow key={s.id}>
                      <TableCell className="px-5 py-4 sm:px-6">
                        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-50 text-brand-500 dark:bg-white/[0.05]">
                          <Icon className="h-4 w-4" aria-hidden />
                        </span>
                      </TableCell>
                      <TableCell className="px-5 py-4 font-medium text-gray-800 text-theme-sm dark:text-white/90 sm:px-6">
                        {s.name}
                      </TableCell>
                      <TableCell className="px-5 py-4 sm:px-6">
                        <Badge size="sm" color="primary" variant="light">
                          {categoryLabel[s.category]}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </BasicTableSurface>

        {items.length > PAGE_SIZE ? (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-4 dark:border-gray-800">
            <p className="text-theme-xs text-gray-500 dark:text-gray-400">
              Page {currentPage} sur {totalPages}
            </p>
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setPage} />
          </div>
        ) : null}
      </ComponentCard>
    </>
  );
}
